import User from '../models/User';
import * as dotenv from 'dotenv';
import axios from 'axios';
// import { error } from 'console';
dotenv.config();

class BoomFiService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    //@ts-ignore
    this.apiKey = process.env.BOOMFI_API_KEY;
    //@ts-ignore
    this.apiUrl = process.env.BOOMFI_API_URL;
  }

  async handleWebhook(payload: any): Promise<boolean> {
    try {
      console.log('Webhook payload received:', JSON.stringify(payload, null, 2));
      
      // Basic payload validation
      if (!payload || !payload.event || !payload.customer) {
        console.error('Invalid webhook payload');
        return false;
      }

      const { event, customer, cancel_at_period_end } = payload;
      const { wallet_address, email, name } = customer;

      // Validate wallet address
      if (!wallet_address) {
        console.error('No wallet address provided in webhook');
        return false;
      }

      // Find or create user
      let user = await User.findOne({ walletAddress: wallet_address });
      
      if (!user) {
        user = new User({
          walletAddress: wallet_address,
          name: '',
          email: '',
          phone: '',
          customerId: '',
          subscription: {
            status: 'Free',
            expiryDate: null,
            subscriptionId: null,
            periodStartAt: null,
            periodEndAt: null,
            cancelAtPeriodEnd: false
          }
        });
      }

      // Update user details
      user.customerId = customer.id || user.customerId;
      user.name = name || user.name;
      user.email = email || user.email;

      // Handle different webhook events
      switch (event) {
        case 'Invoice.Updated':
          if (payload.payment_status === 'Succeeded') {
            const { invoice_items } = payload;
            const subscriptionDetails = invoice_items[0];
            
            user.subscription = {
              ...user.subscription,
              status: 'Premium',
              subscriptionId: subscriptionDetails.subscription.id, // Store subscription ID
              periodStartAt: new Date(subscriptionDetails.period_start_at),
              periodEndAt: new Date(subscriptionDetails.period_end_at),
              expiryDate: new Date(subscriptionDetails.period_end_at),
              cancelAtPeriodEnd: false
            };
          }
          break;

        case 'Subscription.Updated':
          if (cancel_at_period_end !== undefined) {
            user.subscription.cancelAtPeriodEnd = cancel_at_period_end;
            console.log(
              cancel_at_period_end 
                ? 'Subscription scheduled for cancellation' 
                : 'Subscription cancellation removed'
            );
          }
          break;

        case 'Subscription.Canceled':
          user.subscription = {
            status: 'Free',
            expiryDate: undefined,
            subscriptionId: undefined,
            periodStartAt: undefined,
            periodEndAt: undefined,
            cancelAtPeriodEnd: false
          };
          break;

        default:
          console.log(`Unhandled webhook event: ${event}`);
          return false;
      }

      // Save updated user
      await user.save();
      console.log('Webhook processed successfully for wallet:', wallet_address);
      return true;
    } catch (error) {
      console.error('Comprehensive error handling in webhook:', error);
      return false;
    }
  }
  async validateSubscription(walletAddress: string): Promise<boolean> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) return false;

      const now = new Date();
      if (
        user.subscription.status === 'Premium' && 
        user.subscription.expiryDate &&
        !user.subscription.cancelAtPeriodEnd
      ) {
        return now < user.subscription.expiryDate;
      }
      
      return false;
    } catch (error) {
      console.error('Error validating subscription:', error);
      return false;
    }
  }
  async getSubscriptionStatus(walletAddress: string) : Promise<{
    status: 'Free' | 'Premium';
    cancelAtPeriodEnd: boolean;
  }> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) {
        return {
          status: 'Free',
          cancelAtPeriodEnd: false
        };
      }

      const now = new Date();
      const isPremium = user.subscription.status === 'Premium' && 
                        user.subscription.expiryDate &&
                        now < user.subscription.expiryDate &&
                        !user.subscription.cancelAtPeriodEnd;

      return {
        status: isPremium ? 'Premium' : 'Free',
        cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd
      };
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      return {
        status: 'Free',
        cancelAtPeriodEnd: false
      };
    }
  }

  async listCustomers() {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/customers`, {
        headers: {
          'x-api-key': `${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      return {
        success: true,
        data: response.data,
        message: 'Customers fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: 'Failed to fetch customers',
        message: error.response?.data?.message || error.message
      };
    }
  }

  async getCustomerByWallet(customerId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/customers/${customerId}`, {
        headers: {
          'x-api-key': `${this.apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      return {
        success: true,
        data: response.data,
        message: 'Customer fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching customer:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to fetch customer',
        message: error.response?.data?.message || error.message
      };
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/subscriptions`, {
        headers: {
          'x-api-key': `${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          customer_id: customerId
        }
      });

      return {
        success: true,
        data: response.data,
        message: 'Subscriptions fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to fetch subscriptions',
        message: error.response?.data?.message || error.message
      };
    }
  }

  async verifySubscriptionById(subscriptionId: string): Promise<boolean> {
    try {
      // Find user with this subscription ID
      const user = await User.findOne({
        'subscription.subscriptionId': subscriptionId,
        'subscription.status': 'Premium'
      });

      if (!user) return false;

      const now = new Date();
      return user.subscription.expiryDate ? now < user.subscription.expiryDate : false;
    } catch (error) {
      console.error('Error verifying subscription by ID:', error);
      return false;
    }
  }

  async getUserBySubscriptionId(subscriptionId: string): Promise<any> {
    try {
      const user = await User.findOne({
        'subscription.subscriptionId': subscriptionId,
        'subscription.status': 'Premium'
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const now = new Date();
      const isActive = user.subscription.status === 'Premium' && 
                      !user.subscription.cancelAtPeriodEnd &&
                      (!user.subscription.expiryDate || 
                       new Date(user.subscription.expiryDate) > now);

      return {
        success: true,
        data: {
          user: {
            ...user.toObject(),
            subscription: {
              ...user.subscription,
              isActive
            }
          }
        }
      };
    } catch (error) {
      console.error('Error getting user by subscription ID:', error);
      return {
        success: false,
        error: 'Failed to get user details',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new BoomFiService();