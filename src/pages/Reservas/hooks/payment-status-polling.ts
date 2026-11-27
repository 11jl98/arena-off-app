const PAYMENT_STATUS_POLL_INTERVAL_MS = 2_500;

export function getPaymentStatusPollingInterval(active: boolean): number | false {
  return active ? PAYMENT_STATUS_POLL_INTERVAL_MS : false;
}
