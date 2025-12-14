import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  name?: string;
  email?: string;
  phone?: string;
  customerId?: string;
  subscription: {
    status: 'Free' | 'Premium' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
    expiryDate?: Date | null;
    subscriptionId?: string | null;
    periodStartAt?: Date | null;
    periodEndAt?: Date | null;
    cancelAtPeriodEnd: boolean;
  };
  referralCode?: string;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  favorites?: string[];
}

const userSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    trim: true,
    lowercase: true,
    default: () => `no-wallet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  customerId: {
    type: String,
    sparse: true,
    index: true ,
    unique: true,
  },
  subscription: {
    status: {
      type: String,
      enum: ['Free', 'Premium', 'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'],
      default: 'Free',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    periodStartAt: {
      type: Date,
      default: null,
    },
    periodEndAt: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean
    },
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  favorites: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
  strict: false,
});

export default mongoose.model<IUser>('User', userSchema);