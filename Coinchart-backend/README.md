# Coinchart-backend

## Overview
Coinchart-backend is an API service built with Node.js, Express, and MongoDB. It supports user authentication via wallet addresses, subscription management, and integrates with the BoomFi API to manage customer and subscription data.


## Installation
1. **Clone the Repository**
   ```bash
   git clone https://github.com/metavaults/Coinchart-backend.git
   cd Coinchart-backend/Crypto-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the project root with the following (replace placeholder values accordingly):
   ```properties
   MONGODB_URI=your-mongodb-uri
   PORT=5000
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

## Running the Application
- **Development Mode:**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  The production script first compiles TypeScript before running:
  ```bash
  npm start
  ```