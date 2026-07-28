export type CashbackPurpose = 'COURT' | 'BAR';

export type CashbackTransactionType =
  | 'EARNED_CONSUMPTION'
  | 'EARNED_BONUS'
  | 'USED_TAB'
  | 'USED_BOOKING'
  | 'REFUND'
  | 'EXPIRATION';

export interface CashbackConfig {
  cashbackEnabled: boolean;
  barCashbackEnabled: boolean;
  defaultCashbackPercentage: number;
  minPurchaseAmount: number;
  expirationDays: number;
  maxCashbackPerTransaction: number;
}

export interface CashbackWallet {
  id: string;
  userId: string;
  balance: number;
  courtBalance: number;
  barBalance: number;
  blockedBalance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface CashbackTransaction {
  id: string;
  walletId: string;
  type: CashbackTransactionType;
  amount: number;
  purpose?: CashbackPurpose;
  description?: string;
  bookingId?: string;
  tabId?: string;
  qrReceiptId?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface QrReceipt {
  id: string;
  userId: string;
  receiptKey: string;
  totalAmount: number;
  cashbackEarned: number;
  scannedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ScanQrReceiptPayload {
  receiptData: string;
  purpose: CashbackPurpose;
}

export interface ScanQrReceiptResponse {
  cashbackEarned: number;
  totalAmount: number;
  purpose: CashbackPurpose;
  receipt: QrReceipt;
}

export interface TransactionFilters {
  purpose?: CashbackPurpose;
  type?: CashbackTransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}
