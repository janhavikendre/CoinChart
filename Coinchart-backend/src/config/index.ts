import dotenv from 'dotenv';

dotenv.config();

export default  {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coinchart',
  jwtSecret: process.env.JWT_SECRET || 'yash',
  env: process.env.NODE_ENV || 'development',
};