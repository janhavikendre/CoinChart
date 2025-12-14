import { Request, Response } from 'express';
import BoomFiService from '../services/BoomFiService';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    await BoomFiService.handleWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const result = await BoomFiService.listCustomers();
    console.log(req.body);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
};

export const getCustomerByWallet = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;  // changed from walletAddress
    const result = await BoomFiService.getCustomerByWallet(customerId);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      message: error.message
    });
  }
};

export const getCustomerSubscriptions = async (req: Request, res: Response): Promise<any> => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer_id',
        message: 'customer_id is required'
      });
    }
    
    const result = await BoomFiService.getCustomerSubscriptions(customer_id as string);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions',
      message: error.message
    });
  }
};