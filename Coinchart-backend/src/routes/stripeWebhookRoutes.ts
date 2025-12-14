// src/routes/stripeWebhookRoutes.ts
import express from 'express';
import { handleStripeWebhook } from '../controllers/stripeWebhookController';

const router = express.Router();

// Webhook endpoint with proper raw body middleware
router.post('/webhook', 
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    console.log(res);
    // Debug logging - but don't modify the body
    console.log('Webhook middleware: Content-Type', req.headers['content-type']);
    console.log('Webhook middleware: Is body a Buffer?', req.body instanceof Buffer);
    console.log('Webhook middleware: Body length', req.body ? req.body.length : 0);
    
    // Remove any console.log that tries to print req.body directly or stringifies it
    // as this can interfere with the buffer content
    
    next();
  },
  handleStripeWebhook
);

// Testing endpoint
if (process.env.NODE_ENV !== 'production') {
  router.get('/webhook-status', (req, res) => {
    console.log(req)
    res.status(200).json({
      status: 'Webhook endpoint is active',
      environment: process.env.NODE_ENV || 'development',
      endpointUrl: '/api/stripe/webhook'
    });
  });
}

export default router;