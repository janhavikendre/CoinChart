import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Define data directories
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
export const DRIVERS_PATH = process.env.DRIVER_PATH || '/app/drivers';
export const CHROME_PLATFORM = process.env.CHROME_PLATFORM || 'linux64';

export const CANDLESTICK_DIR = path.join(DATA_DIR, 'candlestick_data');

// Create directories if they don't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(CANDLESTICK_DIR)) {
  fs.mkdirSync(CANDLESTICK_DIR, { recursive: true });
}

export const RISK_FILES: Record<string, string> = {
  'binance': 'binance_risks.csv',
  'btcc': 'btcc_risks.csv',
  'cookiefun': 'cookiefun_risks.csv',
};

export const SIGNAL_FILES: Record<string, string> = {
  'binance': 'binance_signals.json',
  'btcc': 'btcc_signals.json',
  'cookiefun': 'cookiefun_signals.json',
};

export const MAX_SIGNALS = 10;

export const BUY_THREAD_ID = 2;
export const SELL_THREAD_ID = 3;

export const S3_ICONS_PATH = 'https://coinchart.fun/icons/';

// DSS Settings
// 1H DSS
export const DSS_1H_NAME = 'DSS_1H';
export const PDS_1H = 10;
export const EMA_LEN_1H = 8;

// 2H DSS
export const DSS_2H_NAME = 'DSS_2H';
export const PDS_2H = 10;
export const EMA_LEN_2H = 8;

// 4H DSS
export const DSS_4H_NAME = 'DSS_4H';
export const PDS_4H = 10;
export const EMA_LEN_4H = 8;

// 8H DSS
export const DSS_8H_NAME = 'DSS_8H';
export const PDS_8H = 10;
export const EMA_LEN_8H = 8;

// 12H DSS
export const DSS_12H_NAME = 'DSS_12H';
export const PDS_12H = 7;
export const EMA_LEN_12H = 5;

// DSS DAILY
export const DSS_1D_NAME = 'DSS_1D';
export const PDS_DAILY = 5;
export const EMA_LEN_DAILY = 5;

// DSS 3D
export const DSS_3D_NAME = 'DSS_3D';
export const PDS_3D = 7;
export const EMA_LEN_3D = 5;

export const NUM_OF_PROCESS_SYMBOLS = null;

// Time frames
export const TF_1 = '1m';
export const TF_5 = '5m';
export const TF_15 = '15m';
export const TF_30 = '30m';
export const TF_1H = '1h';
export const TF_2H = '2h';
export const TF_4H = '4h';
export const TF_12H = '12h';
export const TF_1D = '1d';
export const TF_3D = '3d';
export const TF_1W = '1w';
export const TF_1M = '1M';

// Exchanges
export const BINANCE_EXCHANGE = 'binance';
export const BYBIT_EXCHANGE = 'bybit';
export const BTCC_EXCHANGE = 'btcc';
export const COOKIEFUN_EXCHANGE = 'cookiefun';

// Eligibility Threshold (in days)
export const COINS_HISTORY_DATA_THRESHOLD = 108;
export const COIN_ELIGIBLE_VOLUME_THRESHOLD = 110000;
export const COIN_BUY_VOLUME_THRESHOLD = 160000;

// Strategy Settings
export const WEEKLY_DSS_BUY_THRESHOLD = 20;
export const WEEKLY_DSS_SELL_THRESHOLD = 80;

export const BLACKLIST = ['USDC', 'DAI', 'EUR'];

export const ELIGIBILITY_SKIP = ['BTCUSDT', 'ETHUSDT'];

//export const TIME = new Date(2024, 5, 1, 0, 0).getTime();
export const TIME = null;

// Emojis
export const CYCLE_BELOW_EMOJI = '✅';
export const CYCLE_ABOVE_EMOJI = '❌';
export const CYCLE_BETWEEN_EMOJI = '🙂';
export const CYCLE_RISING_EMOJI = '⬆️';
export const CYCLE_FALLING_EMOJI = '⬇️';
export const CYCLE_SUPER_EMOJI = '✅';
export const CYCLE_FAILED_EMOJI = '❌';

// Telegram Settings
export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
export const TELEGRAM_CHAT = parseInt(process.env.TELEGRAM_CHAT || '-1002480317931');

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_NAME || 'mydatabase',
  raise_on_warnings: true
};

// BTCC Parameters
export const BTCC_USERNAME = process.env.BTCC_USERNAME;
export const BTCC_PASSWORD = process.env.BTCC_PASSWORD;
export const BTCC_API_KEY = process.env.BTCC_API_KEY;
export const BTCC_SECRET_KEY = process.env.BTCC_SECRET_KEY;
export const BTCC_COMPANY_ID = process.env.BTCC_COMPANY_ID || '1';

// Candlestick (K-Line) Interval Types
export const K_LINE_TYPE_1MIN = 35;   // 1 Minute
export const K_LINE_TYPE_5MIN = 0x01; // 5 Minutes
export const K_LINE_TYPE_15MIN = 0x02; // 15 Minutes
export const K_LINE_TYPE_30MIN = 0x03; // 30 Minutes
export const K_LINE_TYPE_60MIN = 0x04; // 1 Hour
export const K_LINE_TYPE_2HOUR = 37;  // 2 Hours
export const K_LINE_TYPE_4HOUR = 38;  // 4 Hours
export const K_LINE_TYPE_DAY = 0x05;  // Daily
export const K_LINE_TYPE_WEEK = 0x06; // Weekly
export const K_LINE_TYPE_MONTH = 0x07; // Monthly

// COOKIEFUN Parameters
export const MAX_AGENTS = 300;
export const MAX_PAGES = 20;