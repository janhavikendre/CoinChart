import express from 'express';
import {
  handleWebhook,
  listCustomers,
  getCustomerByWallet,
  getCustomerSubscriptions
} from '../controllers/subscriptionController';

const router = express.Router();


router.post('/webhook', handleWebhook);


router.get('/customers', listCustomers);

router.get('/customers/:customerId', getCustomerByWallet); 

router.get('/subscriptions', getCustomerSubscriptions);

export default router;