# CoinChart 🚀

A full-stack cryptocurrency analytics and trading platform featuring interactive bubble charts, real-time buy signals, token swapping, and Web3 wallet integration.

**🌐 Live Demo:** [https://coinchart.fun/](https://coinchart.fun/)  
**📦 GitHub Repository:** [https://github.com/janhavikendre/CoinChart](https://github.com/janhavikendre/CoinChart)

---

## ✨ Features

### 📊 Interactive Data Visualization
- **D3.js Bubble Charts**: Dynamic, interactive cryptocurrency market visualization
- Real-time market data tracking across multiple exchanges
- Responsive design for desktop and mobile devices

### 💰 Trading & Analytics
- **Buy Signals Panel**: Premium and free tier trading signals
- **Token Swapping**: Integrated Changelly API for cross-chain token swaps
- TradingView widget integration for advanced charting

### 🔐 Web3 Integration
- **Wallet Connection**: Support for MetaMask, WalletConnect, Coinbase Wallet via RainbowKit
- Web3 authentication using Wagmi and Viem
- Multi-chain support (Ethereum, BSC, Polygon, Arbitrum)

### 💳 Subscription Management
- Stripe payment integration with webhook handlers
- Premium subscription tiers with automatic renewal
- User authentication and subscription status tracking

### 🎨 Modern UI/UX
- TailwindCSS for responsive, modern design
- Mobile-first approach with adaptive layouts
- Dark theme optimized for trading environments

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **D3.js** for data visualization
- **TailwindCSS** for styling
- **RainbowKit** & **Wagmi** for Web3 integration
- **React Query** for data fetching and caching
- **React Router** for navigation

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **MongoDB** with Mongoose for data persistence
- **Stripe** for payment processing
- **Web3.js** for blockchain interactions
- **Axios** for external API calls

### Infrastructure & DevOps
- **Docker** containerization for both frontend and backend
- **Docker Compose** for orchestration
- **GitHub Actions** for CI/CD pipelines
- Environment-based configuration

---

## 📁 Project Structure

```
Coinchart/
├── frontend-coinchartfun/     # React frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript types
│   ├── Docker/                # Docker configuration
│   └── package.json
│
└── Coinchart-backend/         # Express backend API
    ├── src/
    │   ├── controllers/       # Route controllers
    │   ├── routes/            # API routes
    │   ├── models/            # MongoDB models
    │   ├── services/          # Business logic
    │   └── middleware/        # Express middleware
    ├── Docker/                # Docker configuration
    ├── docker-compose.yaml    # Docker Compose setup
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (optional)
- MongoDB instance (local or cloud)
- Stripe account (for payments)
- Changelly API key (for token swaps)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/janhavikendre/CoinChart.git
   cd CoinChart
   ```

2. **Backend Setup**
   ```bash
   cd Coinchart-backend
   npm install
   ```
   
   Create a `.env` file:
   ```env
   MONGODB_URI=your-mongodb-connection-string
   PORT=5000
   JWT_SECRET=your-jwt-secret
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   NODE_ENV=development
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend-coinchartfun
   npm install
   ```
   
   Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_CHANGELLY_API_KEY=your-changelly-api-key
   ```

### Running with Docker

```bash
# Backend
cd Coinchart-backend
docker-compose up -d

# Frontend
cd ../frontend-coinchartfun
docker build -f Docker/Dockerfile -t coinchart-frontend .
docker run -p 5173:5173 coinchart-frontend
```

### Running Locally

**Backend:**
```bash
cd Coinchart-backend
npm run dev
```

**Frontend:**
```bash
cd frontend-coinchartfun
npm run dev
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify authentication

### Subscriptions
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/create` - Create subscription
- `POST /api/stripe/webhook` - Stripe webhook handler

### Market Data
- `GET /signals` - Get trading signals
- `GET /risks/:source` - Get risk data
- `GET /candle_data/:source` - Get candlestick data
- `GET /symbol_list` - Get available symbols

### Token Swapping
- `POST /api/defi-swap/*` - Changelly API proxy

---

## 🎯 Key Features Implementation

### Buy Signals System
- Real-time signal fetching from backend API
- Premium vs. free tier signal differentiation
- Signal cards with token information and recommendations

### Token Swapping
- Multi-chain token selection
- Real-time price quotes via Changelly
- ERC-20 token approval flow
- Transaction confirmation and tracking

### Subscription Management
- Stripe Checkout integration
- Webhook-based subscription status updates
- Automatic premium feature unlocking
- Subscription renewal handling

---

## 🐳 Docker Configuration

Both frontend and backend include Dockerfiles for containerized deployment:

- **Backend Dockerfile**: Node.js 18 Alpine with MongoDB connection retry logic
- **Frontend Dockerfile**: Node.js 18 Alpine with Vite build process
- **Docker Compose**: Orchestrates backend service with environment variables

---

## 🔄 CI/CD Pipeline

GitHub Actions workflows configured for:
- Automated testing
- Docker image building
- Deployment automation
- Environment-specific configurations

---

## 📱 Responsive Design

- **Desktop**: Full-featured layout with side panels and detailed charts
- **Mobile**: Optimized touch interface with adaptive navigation
- **Tablet**: Landscape/portrait mode support

---

## 🔒 Security Features

- JWT-based authentication
- Secure Web3 wallet connection
- Stripe webhook signature verification
- CORS configuration
- Environment variable management

---

## 📈 Performance Optimizations

- React Query for efficient data caching
- Code splitting with Vite
- Optimized D3.js rendering
- Lazy loading for components
- MongoDB connection pooling

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Author

**Janhavi Kendre**
- GitHub: [@janhavikendre](https://github.com/janhavikendre)
- Live Site: [coinchart.fun](https://coinchart.fun/)

---

## 🎉 Acknowledgments

- Changelly API for token swapping
- TradingView for chart widgets
- RainbowKit for Web3 wallet integration
- D3.js community for visualization libraries

---

**Built with ❤️ using React, Node.js, and modern web technologies**

