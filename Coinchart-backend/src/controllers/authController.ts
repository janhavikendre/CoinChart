import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';


export class AuthController {
  static generateToken(user: any) {
    return jwt.sign(
      { _id: user._id?.toString() },
      process.env.JWT_SECRET || 'yash',
      { expiresIn: '7d' }
    );
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json({ 
          success: false,
          message: 'Wallet address is required' 
        });
        return;
      }

      let user = await User.findOne({ walletAddress });
      
      if (user) {
        const token = AuthController.generateToken(user);
        res.status(200).json({ 
          success: true,
          message: 'User info retrieved successfully',
          isNewUser: false,
          token,
          user
        });
        return;
      }

      // Create new user if doesn't exist
      user = new User({
        walletAddress,
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
          cancelAtPeriodEnd: true
        }
      });
      
      await user.save();
      const token = AuthController.generateToken(user);

      res.status(201).json({ 
        success: true,
        message: 'User created successfully',
        isNewUser: true,
        token,
        user 
      });
    } catch (error) {
      console.error('Error in user operation:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
  static async checkSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
        return;
      }

      const user = await User.findOne({ walletAddress });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Verify subscription status
      const subscriptionStatus = user.subscription;
      const isActive = subscriptionStatus.status === 'Premium' && 
                      !subscriptionStatus.cancelAtPeriodEnd &&
                      (!subscriptionStatus.expiryDate || 
                       new Date(subscriptionStatus.expiryDate) > new Date());

      res.status(200).json({
        success: true,
        message: 'Subscription status retrieved successfully',
        user: {
          ...user.toObject(),
          subscription: {
            ...subscriptionStatus,
            isActive
          }
        }
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async addFavoriteCoin(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, coinId } = req.body;

      if (!walletAddress || !coinId) {
        res.status(400).json({
          success: false,
          message: 'Wallet address and coin ID are required'
        });
        return;
      }

      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.favorites) {
        user.favorites = [];
      }

      if (!user.favorites.includes(coinId)) {
        user.favorites.push(coinId);
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Coin added to favorites',
        favorites: user.favorites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async removeFavoriteCoin(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, coinId } = req.body;

      if (!walletAddress || !coinId) {
        res.status(400).json({
          success: false,
          message: 'Wallet address and coin ID are required'
        });
        return;
      }

      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.favorites) {
        user.favorites = [];
      }
      user.favorites = user.favorites.filter(id => id !== coinId);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Coin removed from favorites',
        favorites: user.favorites
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  static async getFavoritesCoins(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
        return;
      }

      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Favorites retrieved successfully',
        favorites: user.favorites || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}