// src/controllers/stripeWebhookController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import User from '../models/User';
import mongoose from 'mongoose';

// Add mutex/lock map at the top
const customerLocks = new Map<string, boolean>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add helper function for retry logic
async function retryTransaction<T>(operation: () => Promise<T>, customerId: string): Promise<T> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      // Wait if there's an existing operation for this customer
      while (customerLocks.get(customerId)) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      // Set lock
      customerLocks.set(customerId, true);
      
      // Perform operation
      const result = await operation();
      
      // Release lock
      customerLocks.delete(customerId);
      
      return result;
    } catch (error: any) {
      attempts++;
      
      // Release lock on error
      customerLocks.delete(customerId);
      
      if (error.code === 112 && attempts < MAX_RETRIES) { // WriteConflict error
        console.log(`Retry attempt ${attempts} for customer ${customerId}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempts));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} attempts`);
}

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' 
});

// Add this type at the top of the file
type SubscriptionStatus = 'Premium' | 'Free' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';

// Webhook secret for verifying events
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;

  try {
    // Debug logging
    console.log('📣 Webhook request received');
    
    // Ensure req.body is a Buffer (raw body) for signature verification
    if (!req.body || !(req.body instanceof Buffer)) {
      console.error('❌ Request body is not a Buffer. Express.raw middleware is not working properly.');
      return res.status(400).send('Webhook Error: No raw body available for signature verification');
    }
    
    console.log('📦 Raw body received, length:', req.body.length);

    try {
      // Verify the signature with the webhook secret
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('✅ Webhook signature verified successfully');
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Log successful webhook receipt
    console.log('🎉 Webhook verified successfully:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString()
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🔑 CHECKOUT SESSION COMPLETED - Processing wallet address and customer ID pairing');
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'charge.succeeded':
        console.log('💰 CHARGE SUCCEEDED - Processing payment confirmation');
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;
      
      case 'customer.subscription.created':
        console.log('🆕 SUBSCRIPTION CREATED - Processing initial subscription');
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        console.log('🔄 SUBSCRIPTION UPDATED - Processing subscription changes');
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        console.log('🗑️ SUBSCRIPTION DELETED - Processing subscription deletion');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 success response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
    
  } catch (err: any) {
    console.error(`❌ Error processing webhook:`, err);
    return res.status(500).send(`Webhook Error: ${err.message}`);
  }
};

// Extract wallet address from checkout session
function extractWalletAddress(session: Stripe.Checkout.Session): string | null {
  try {
    // First check custom_fields
    if (session.custom_fields && session.custom_fields.length > 0) {
      const walletField = session.custom_fields.find(field => 
        field.key === 'walletaddressforpremiumaccessonthewebsite' ||
        (field.label?.custom && field.label.custom.toLowerCase().includes('wallet address'))
      );
      
      if (walletField && walletField.type === 'text' && walletField.text?.value) {
        const walletValue = walletField.text.value.trim();
        console.log(`🔑 Found wallet address in custom fields: ${walletValue}`);
        return walletValue;
      }
    }
    
    // Then check metadata
    if (session.metadata?.wallet_address) {
      const walletValue = session.metadata.wallet_address.trim();
      console.log(`🔑 Found wallet address in metadata: ${walletValue}`);
      return walletValue;
    }
  } catch (err) {
    console.error('❌ Error extracting wallet address:', err);
  }
  
  console.log('❓ No wallet address found in session');
  return null;
}

// Modify handleCheckoutCompleted to use retry logic
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  if (!customerId) return;

  await retryTransaction(async () => {
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    
    try {
      console.log('🧾 Processing checkout session completed:', session.id);
    
      const customerId = session.customer as string;
      if (!customerId) {
        console.log('❌ No customer ID in checkout session - cannot proceed');
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        return;
      }
      
      // Check if payment was successful
      if (session.payment_status !== 'paid') {
        console.log(`⚠️ Checkout session ${session.id} not paid, status: ${session.payment_status}`);
        await mongoSession.abortTransaction();
        mongoSession.endSession();
        return;
      }
      
      // Get wallet address from session (may be null if none provided)
      const walletAddress = extractWalletAddress(session);
      
      // IMPORTANT: First look up user by customerId
      console.log(`🔍 Looking for existing user with customer ID: ${customerId}`);
      let user = await User.findOne({ customerId }).session(mongoSession);
      
      // Prepare subscription data
      let subscriptionData: {
        status: SubscriptionStatus;
        expiryDate: Date | null;
        subscriptionId: string | null;
        periodStartAt: Date | null;
        periodEndAt: Date | null;
        cancelAtPeriodEnd: boolean;
      } = {
        status: session.subscription ? 'Premium' : 'Free',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionId: session.subscription as string || null,
        periodStartAt: new Date(),
        periodEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      };
      
      // Get detailed subscription data if available
      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          console.log("📄 Retrieved subscription:", {
            id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end
          });
          
          subscriptionData = {
              status: subscription.status as SubscriptionStatus,
              subscriptionId: subscription.id,
              periodStartAt: new Date(subscription.current_period_start * 1000),
              periodEndAt: new Date(subscription.current_period_end * 1000),
              expiryDate: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            };

          // Force set cancelAtPeriodEnd to false for new paid subscriptions
          if (session.payment_status === 'paid' && subscription.status === 'active') {
            subscriptionData.cancelAtPeriodEnd = false;
          }
        } catch (err) {
          console.error('❌ Error retrieving subscription:', err);
        }
      }
      
      if (user) {
        // Found existing user with this customerId - update it
        console.log(`✅ Found existing user for customer ID: ${customerId}`);
        
        // If we have a valid wallet address and the user doesn't, update it
        if (walletAddress && (!user.walletAddress || user.walletAddress.includes('missing-wallet') || user.walletAddress.includes('no-wallet'))) {
          console.log(`🔄 Updating user with wallet address: ${walletAddress}`);
          user.walletAddress = walletAddress.toLowerCase();
        } else if (walletAddress) {
          console.log(`ℹ️ User already has wallet address: ${user.walletAddress}, not changing`);
        }
        
        //ts-ignore
        user.subscription = subscriptionData;
        
        // Add customer details if available
        if (session.customer_details) {
          if (session.customer_details.email) {
            user.email = session.customer_details.email;
          }
          if (session.customer_details.name) {
            user.name = session.customer_details.name;
          }
        }
        
        await user.save({ session: mongoSession });
        console.log(`✅ Updated existing user with customer ID: ${customerId}`);
        console.log(`📊 Subscription status: ${subscriptionData.status}, cancelAtPeriodEnd: ${subscriptionData.cancelAtPeriodEnd}`);
      } else {
        // No user with this customerId - create new user
        console.log(`🆕 No user found with customer ID: ${customerId}, creating new user`);
        
        // Prepare user data
        const userData: any = {
          customerId: customerId,
          email: session.customer_details?.email || '',
          name: session.customer_details?.name || '',
          subscription: subscriptionData
        };
        
        // Only set wallet address if we have one
        if (walletAddress) {
          userData.walletAddress = walletAddress.toLowerCase();
          console.log(`🔑 Setting wallet address: ${walletAddress.toLowerCase()}`);
        } else {
          console.log(`ℹ️ No wallet address provided, using schema default`);
        }
        
        // Create new user
        const newUser = new User(userData);
        await newUser.save({ session: mongoSession });
        console.log(`✅ Created new user with customer ID: ${customerId}`);
        console.log(`📊 Subscription status: ${subscriptionData.status}, cancelAtPeriodEnd: ${subscriptionData.cancelAtPeriodEnd}`);
      }
      
      // Commit the transaction
      await mongoSession.commitTransaction();
      console.log('✅ MongoDB transaction committed successfully');
      
    } catch (error: any) {
      // Abort transaction on error
      console.error(`❌ Error handling checkout session:`, error);
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      // End session in finally block
      mongoSession.endSession();
    }
  }, customerId);
}

// Handle charge.succeeded event
async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log('💰 Processing charge.succeeded:', charge.id);
  
  try {
    const customerId = charge.customer as string;
    if (!customerId) {
      console.log('❌ No customer ID in charge - cannot proceed');
      return;
    }
    
    console.log(`🔍 Looking up user with customer ID: ${customerId}`);
    const user = await User.findOne({ customerId });
    
    if (user) {
      console.log(`✅ Found user for customer ID: ${customerId}`);
      
      // Check if this charge confirms a subscription
      if (charge.invoice) {
        console.log(`📋 This charge is associated with invoice: ${charge.invoice}`);
        
        // Update subscription status and cancelAtPeriodEnd
        if (user.subscription.status !== 'Premium' || user.subscription.cancelAtPeriodEnd === true) {
          // When payment succeeds, user should have Premium status and NOT be canceled
          user.subscription.status = 'Premium';
          user.subscription.cancelAtPeriodEnd = false;
          
          await user.save();
          console.log(`✅ Updated subscription status to Premium, cancelAtPeriodEnd=false`);
        } else {
          console.log(`ℹ️ User already has correct subscription settings`);
        }
      } else {
        console.log(`ℹ️ This charge is not associated with an invoice, no subscription update needed`);
      }
    } else {
      console.log(`⚠️ No user found for customer ID ${customerId}`);
    }
  } catch (error: any) {
    console.error(`❌ Error handling charge succeeded:`, error);
  }
}

// Handle subscription created event
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Processing customer.subscription.created:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    if (!customerId) {
      console.log('❌ No customer ID in subscription - cannot proceed');
      return;
    }
    
    const periodEnd = new Date(subscription.current_period_end * 1000);
    const periodStart = new Date(subscription.current_period_start * 1000);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    console.log(`📊 Subscription details for ${subscription.id}:`);
    console.log(`- Customer ID: ${customerId}`);
    console.log(`- Status: ${subscription.status}`);
    console.log(`- cancel_at_period_end: ${subscription.cancel_at_period_end}`);
    
    // Find user by customerId - NEVER create a duplicate
    let user = await User.findOne({ customerId });
    
    if (user) {
      console.log(`✅ Found existing user for customer ID: ${customerId}`);
      
      // Update subscription data
      user.subscription = {
        status: subscription.status as SubscriptionStatus,
        subscriptionId: subscription.id,
        periodStartAt: periodStart,
        periodEndAt: periodEnd,
        expiryDate: periodEnd,
        cancelAtPeriodEnd: cancelAtPeriodEnd
      };
      
      await user.save();
      console.log(`✅ Updated subscription for user`);
    } else {
      console.log(`🆕 No user found with customer ID: ${customerId}, creating record`);
      
      // Create minimal record with just customer ID
      const newUser = new User({
        customerId: customerId,
        subscription: {
          status: subscription.status as SubscriptionStatus,
          subscriptionId: subscription.id,
          periodStartAt: periodStart,
          periodEndAt: periodEnd,
          expiryDate: periodEnd,
          cancelAtPeriodEnd: cancelAtPeriodEnd
        }
      });
      
      await newUser.save();
      console.log(`✅ Created user record with customer ID: ${customerId}`);
    }
  } catch (error: any) {
    console.error(`❌ Error handling subscription created:`, error);
  }
}

// Modify handleSubscriptionUpdated to use retry logic
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  if (!customerId) return;

  await retryTransaction(async () => {
    console.log('🔄 Processing customer.subscription.updated:', subscription.id);
  
    try {
      const customerId = subscription.customer as string;
      if (!customerId) {
        console.log('❌ No customer ID in subscription - cannot proceed');
        return;
      }
      
      const periodEnd = new Date(subscription.current_period_end * 1000);
      const periodStart = new Date(subscription.current_period_start * 1000);
      const status = subscription.status;
      
      // Get cancelation status from Stripe (negated for our system)
      const cancelAtPeriodEnd = subscription.cancel_at_period_end;
      
      console.log(`📊 Subscription update details for ${subscription.id}:`);
      console.log(`- Customer ID: ${customerId}`);
      console.log(`- Status: ${status}`);
      console.log(`- cancel_at_period_end: ${subscription.cancel_at_period_end}`);
      
      // Check previous attributes for changes
      const event = subscription as any;
      const previousAttributes = event.previous_attributes;
      
      if (previousAttributes) {
        if ('cancel_at_period_end' in previousAttributes) {
          const wasCanceled = previousAttributes.cancel_at_period_end;
          
          if (wasCanceled === true && !cancelAtPeriodEnd) {
            console.log('🔄 IMPORTANT: Subscription cancellation was UNDONE (reactivated)');
          } else if (wasCanceled === false && cancelAtPeriodEnd) {
            console.log('🔄 IMPORTANT: Subscription was set to CANCEL at period end');
          }
        }
      }
      
      // ALWAYS find by customerId first to avoid duplicates
      let user = await User.findOne({ customerId });
      
      // If not found by customerId, try by subscription ID as fallback
      if (!user) {
        user = await User.findOne({ 'subscription.subscriptionId': subscription.id });
        
        if (user) {
          console.log(`⚠️ Found user by subscription ID but not by customerId. Updating customerId.`);
          user.customerId = customerId;
        }
      }
      
      if (user) {
        console.log(`✅ Found existing user for customer ID: ${customerId}`);
        
        // Update user subscription with value from Stripe
        user.subscription = {
          status: subscription.status as SubscriptionStatus,
          subscriptionId: subscription.id,
          periodStartAt: periodStart,
          periodEndAt: periodEnd,
          expiryDate: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end  // Using direct value from Stripe
        };
        
        await user.save();
        console.log(`✅ Updated subscription for user`);
      } else {
        console.log(`🆕 No user found for customer ID: ${customerId}, creating record`);
        
        // Create minimal record with just customer ID - NO WALLET ADDRESS
        const newUser = new User({
          customerId: customerId,
          subscription: {
            status: subscription.status as SubscriptionStatus,
            subscriptionId: subscription.id,
            periodStartAt: periodStart,
            periodEndAt: periodEnd,
            expiryDate: periodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end  // Using direct value from Stripe
          }
        });
        
        await newUser.save();
        console.log(`✅ Created user record with customer ID: ${customerId}`);
      }
    } catch (error: any) {
      console.error(`❌ Error handling subscription updated:`, error);
      throw error;
    }
  }, customerId);
}

// Handle subscription deleted event
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🗑️ Processing customer.subscription.deleted:', subscription.id);
  
  try {
    const customerId = subscription.customer as string;
    if (!customerId) {
      console.log('❌ No customer ID in subscription - cannot proceed');
      return;
    }
    
    // Find user by customerId
    let user = await User.findOne({ customerId });
    
    // If not found by customerId, try by subscription ID as fallback
    if (!user) {
      user = await User.findOne({ 'subscription.subscriptionId': subscription.id });
    }
    
    if (user) {
      console.log(`✅ Found user for customer ID: ${customerId}`);
      
      // Set user to Free status and clear subscription data
      user.subscription = {
        status: 'Free',
        expiryDate: null,
        subscriptionId: null,
        periodStartAt: null,
        periodEndAt: null,
        cancelAtPeriodEnd: true  // Setting to true when subscription is deleted
      };
      
      await user.save();
      console.log(`✅ Updated user to Free status, cancelAtPeriodEnd=true (NO auto-renewal)`);
    } else {
      console.log(`⚠️ No user found for customer ID ${customerId} or subscription ID ${subscription.id}`);
    }
  } catch (error: any) {
    console.error(`❌ Error handling subscription deleted:`, error);
  }
}