import type { InitiateCardPaymentResponse } from '@/types';

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Saldo ou limite do cartão insuficiente para esta compra.',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) inválido. Confira e tente novamente.',
  cc_rejected_bad_filled_date: 'Data de validade do cartão inválida. Confira e tente novamente.',
  cc_rejected_bad_filled_cardholder_name: 'Nome do titular do cartão inválido. Confira e tente novamente.',
  cc_rejected_expired_card: 'Cartão vencido. Use outro cartão ou tente novamente.',
  cc_rejected_card_disabled: 'Cartão desabilitado ou bloqueado. Fale com a operadora do cartão.',
  cc_rejected_card_number_invalid: 'Número do cartão inválido. Confira e tente novamente.',
  cc_rejected_invalid_installments: 'Quantidade de parcelas inválida. Escolha outra opção.',
  cc_rejected_duplicated_payment: 'Pagamento duplicado. Verifique se a cobrança não já foi realizada.',
  cc_rejected_high_risk: 'A transação precisa de autorização. Fale com a operadora do cartão.',
  cc_rejected_blacklist: 'Este cartão não está autorizado para esta operação.',
  cc_rejected_max_attempts: 'Limite de tentativas excedido. Tente novamente em instantes.',
  cc_rejected_call_for_authorize: 'Cartão recusado. Entre em contato com a operadora do cartão.',
  cc_rejected_processing_error: 'Não foi possível processar o pagamento. Tente novamente.',
  cc_rejected_other_reason: 'Pagamento recusado pela operadora do cartão.',
  cc_type_not_allowed: 'Este tipo de cartão não é aceito. Use um cartão de crédito.',
  fund: 'Saldo ou limite do cartão insuficiente para esta compra.',
  secu: 'Código de segurança (CVV) inválido. Confira e tente novamente.',
  expi: 'Data de validade do cartão inválida. Confira e tente novamente.',
  form: 'Dados do titular do cartão inválidos. Confira e tente novamente.',
  card: 'Número do cartão inválido. Confira e tente novamente.',
  inst: 'Quantidade de parcelas inválida. Escolha outra opção.',
  dupl: 'Pagamento duplicado. Verifique se a cobrança não já foi realizada.',
  call: 'A transação precisa de autorização. Fale com a operadora do cartão.',
  lock: 'Cartão desabilitado ou bloqueado. Fale com a operadora do cartão.',
  atte: 'Limite de tentativas excedido. Tente novamente em instantes.',
  blac: 'Este cartão não está autorizado para esta operação.',
  ctna: 'Este tipo de cartão não é aceito. Use um cartão de crédito.',
  othe: 'Pagamento recusado pela operadora do cartão.',
};

function extractRejectionDetail(result: InitiateCardPaymentResponse): string | undefined {
  return (
    result.statusDetail ??
    result.status_detail ??
    result.rejectionReason ??
    result.rejection_reason ??
    undefined
  );
}

/**
 * Returns a human-friendly message explaining why the card payment was refused.
 * Handles the raw Mercado Pago detail in both "cc_rejected_*" and short-code
 * forms, and falls back to a generic message when no detail is provided.
 */
export function getCardRejectionMessage(result: InitiateCardPaymentResponse): string {
  const detail = extractRejectionDetail(result);
  if (!detail) {
    return 'Pagamento recusado. Verifique os dados do cartão e tente novamente.';
  }

  const key = detail.trim().toLowerCase();
  const direct = REJECTION_MESSAGES[key];
  if (direct) return direct;

  const stripped = key.replace(/^cc_rejected_/, '');
  const strippedMessage = REJECTION_MESSAGES[stripped];
  if (strippedMessage) return strippedMessage;

  return `Pagamento recusado: ${detail}.`;
}
