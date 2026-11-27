export function getCashbackTransactionLabel(
  transaction: {
    type: string;
    bookingId?: string;
  },
  fallbackLabel: string
): string {
  if (transaction.type === 'EARNED_CONSUMPTION' && transaction.bookingId) {
    return 'Pagamento online';
  }

  return fallbackLabel;
}
