export type CashbackTransactionType =
  | 'EARNED_CONSUMPTION'
  | 'EARNED_BONUS'
  | 'USED_TAB'
  | 'USED_BOOKING'
  | 'REFUND'
  | 'EXPIRATION';

export interface CashbackWallet {
  id: string;
  userId: string;
  balance: number;
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
}

export interface ScanQrReceiptResponse {
  cashbackEarned: number;
  totalAmount: number;
  receipt: QrReceipt;
}
