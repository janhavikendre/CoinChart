import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
// import risksSignalsRoutes from "./routes/risksSignalsRoutes"
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes"

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import risksSignalsRoutes from './routes/risksSignalsRoutes';
// import tokenRoutes from './routes/tokenRoutes';

// Changelly API Configuration
const CHANGELLY_API_KEY = "57d18ecb-7f0e-456c-a085-2d43ec6e2b3f";

// Initialize express app
const app = express();

app.use('/api/stripe', stripeWebhookRoutes);
// Middleware
app.use(cors());
// Stripe webhooks should be added before CORS middleware

app.use(morgan('dev'));


app.use(express.json());

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/', risksSignalsRoutes);
// app.use('/api/tokens', tokenRoutes);

// ===== CHANGELLY PROXY ROUTES =====
app.use('/api/defi-swap', async (req, res) => {
  try {
    // Construct the target URL
    const targetPath = req.path;
    const targetUrl = `https://changelly.com/defi-swap${targetPath}`;
    
    // Log the outgoing request
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    console.log('Query params:', req.query);
    
    // Create request config
    const config: any = {
      method: req.method,
      url: targetUrl,
      params: req.query,
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': CHANGELLY_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.127 Safari/537.36'
      }
    };
    
    // Add request body for non-GET requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }
    
    // Forward the request to Changelly
    const response = await axios(config);
    
    // Return the response from Changelly
    return res.status(response.status || 200).json(response.data);
  } catch (error: any) {
    console.error('Changelly proxy error:', error.message);
    
    // Forward error from Changelly if available
    if (error.response) {
      return res.status(error.response.status || 500).json(error.response.data);
    }
    
    // Generic error
    return res.status(500).json({ 
      error: 'An error occurred while processing your request',
      message: error.message
    });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection options
const mongoOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  // Remove deprecated options
};

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log('Attempting to connect to MongoDB: ' + process.env.MONGODB_URI);
      await mongoose.connect(process.env.MONGODB_URI!, mongoOptions);
      console.log('Connected to MongoDB successfully');
      
      // Start token update tasks
      // startTokenTasks();
      console.log('Token update tasks started');
      
      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Changelly API proxy available at /api/defi-swap/*`);
      });

      break; // Exit the loop if connection is successful
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error);
      
      if (retries === maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB');
        process.exit(1);
      }
      
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Start the connection process
connectWithRetry().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});

export default app;