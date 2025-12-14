// Data formatting utilities
export const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };
  
  export const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };
  
  // Error handling utilities
  export class AppError extends Error {
    constructor(
      public statusCode: number,
      message: string
    ) {
      super(message);
      this.name = 'AppError';
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export const handleError = (error: any): { status: number; message: string } => {
    if (error instanceof AppError) {
      return {
        status: error.statusCode,
        message: error.message
      };
    }
    return {
      status: 500,
      message: 'Internal server error'
    };
  };