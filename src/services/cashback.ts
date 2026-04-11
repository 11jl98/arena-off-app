import { httpClient } from './api';
import type {
  CashbackWallet,
  CashbackTransaction,
  QrReceipt,
  ScanQrReceiptPayload,
  ScanQrReceiptResponse,
} from '@/types/cashback';

export const CashbackService = {
  async getWallet(clientId?: string): Promise<CashbackWallet> {
    const params: Record<string, string> = {};
    if (clientId) params.clientId = clientId;
    return httpClient.get<CashbackWallet>('/cashback/wallet', { params });
  },

  async getTransactions(limit = 50, clientId?: string): Promise<CashbackTransaction[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (clientId) params.clientId = clientId;
    return httpClient.get<CashbackTransaction[]>(
      '/cashback/transactions',
      { params }
    );
  },

  async scanQrReceipt(payload: ScanQrReceiptPayload): Promise<ScanQrReceiptResponse> {
    return httpClient.post<ScanQrReceiptResponse>('/cashback/qr-receipt', payload);
  },

  async getQrReceipts(): Promise<QrReceipt[]> {
    return httpClient.get<QrReceipt[]>('/cashback/qr-receipts');
  },
};
