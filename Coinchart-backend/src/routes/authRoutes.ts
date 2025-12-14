import express from 'express';
import { AuthController } from '../controllers/authController';
import { auth } from '../middleware/auth1';
import BoomFiService from '../services/BoomFiService';
import User from '../models/User';

const router = express.Router();


router.post('/register', AuthController.register);

router.post('/check-subscription', auth, AuthController.checkSubscription);

router.post('/test-webhook', async (req, res) => {
    try {
      console.log('Received test webhook:', req.body);
      const testPayload = {
        id: "sub_2skpZIHTYzecGZsi2X02WCJKsfs",
        customer: {
          id: "cus_2skpZG6PAOlJ7c4BY3KVgdQK4nA",
          name: "BD",
          email: "bestcryptobd@gmail.com",
          wallet_address: "0x3Ec2433f59a8ec08035904018dCD44aDF1DbC0d2" 
        },
        cancel_at_period_end: true,
        start_at: new Date().toISOString(),
        event: "Subscription.Updated"
      };
  
      const result = await BoomFiService.handleWebhook(testPayload);
  
      if (result) {
        const updatedUser = await User.findOne({ walletAddress: testPayload.customer.wallet_address.toLowerCase() });
        res.status(200).json({
          success: true,
          message: 'Test webhook processed successfully',
          user: updatedUser
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Test webhook processing failed'
        });
      }
    } catch (error) {
      console.error('Error in test webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error in test webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
router.get('/verify-subscription/:pid', async (req, res) => {
  try {
    const subscriptionId = req.params.pid;
    const result = await BoomFiService.getUserBySubscriptionId(subscriptionId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User information retrieved successfully',
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found or subscription invalid',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify subscription',
      message: error.message 
    });
  }
});

router.post('/favorites/add', auth, AuthController.addFavoriteCoin);
router.post('/favorites/remove', auth, AuthController.removeFavoriteCoin);
router.get('/favorites/:walletAddress', auth, AuthController.getFavoritesCoins);

export default router;