import assert from 'node:assert/strict';
import test from 'node:test';
import { getCashbackTransactionLabel } from './transaction-label.ts';
import { getPaymentStatusPollingInterval } from '../../pages/Reservas/hooks/payment-status-polling.ts';

test('labels cashback earned by an online booking as an online payment', () => {
  assert.equal(
    getCashbackTransactionLabel({
      type: 'EARNED_CONSUMPTION',
      bookingId: 'booking-1',
    }),
    'Pagamento online'
  );
});

test('keeps bar consumption label for cashback from bar purchases', () => {
  assert.equal(
    getCashbackTransactionLabel({ type: 'EARNED_CONSUMPTION' }, 'Consumo no bar'),
    'Consumo no bar'
  );
});

test('polls payment status every 2.5 seconds while active and stops when inactive', () => {
  assert.equal(getPaymentStatusPollingInterval(true), 2500);
  assert.equal(getPaymentStatusPollingInterval(false), false);
});
