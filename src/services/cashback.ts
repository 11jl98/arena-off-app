import { httpClient } from './api';
import type {
  CashbackWallet,
  CashbackConfig,
  CashbackTransaction,
  QrReceipt,
  ScanQrReceiptPayload,
  ScanQrReceiptResponse,
  TransactionFilters,
} from '@/types/cashback';

export const CashbackService = {
  async getConfig(): Promise<CashbackConfig> {
    return httpClient.get<CashbackConfig>('/cashback/admin/config');
  },

  async getWallet(clientId?: string): Promise<CashbackWallet> {
    const params: Record<string, string> = {};
    if (clientId) params.clientId = clientId;
    return httpClient.get<CashbackWallet>('/cashback/wallet', { params });
  },

  async getTransactions(filters?: TransactionFilters): Promise<CashbackTransaction[]> {
    const params: Record<string, string> = {};
    if (filters?.purpose) params.purpose = filters.purpose;
    if (filters?.type) params.type = filters.type;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    params.limit = String(filters?.limit ?? 50);
    return httpClient.get<CashbackTransaction[]>('/cashback/transactions', { params });
  },

  async scanQrReceipt(payload: ScanQrReceiptPayload): Promise<ScanQrReceiptResponse> {
    return httpClient.post<ScanQrReceiptResponse>('/cashback/qr-receipt', payload);
  },

  async getQrReceipts(): Promise<QrReceipt[]> {
    return httpClient.get<QrReceipt[]>('/cashback/qr-receipts');
  },
};
