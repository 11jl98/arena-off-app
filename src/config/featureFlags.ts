/**
 * Feature Flags
 *
 * Controla a ativação/desativação de funcionalidades em rollout gradual.
 *
 * ONLINE_PAYMENT_PIX_ENABLED  — PIX via Banco Inter (único método online)
 * ONLINE_PAYMENT_CARD_ENABLED — cartão (desativado: gateway é só PIX)
 * QR_RECEIPT_SCAN_ENABLED     — "Ler QRCode de notinha" (desativado por enquanto;
 *                               a carteira com histórico continua disponível)
 */
export const FEATURE_FLAGS = {
  /**
   * Pagamento online via PIX (Banco Inter) — gera cashback para futuras alocações.
   */
  ONLINE_PAYMENT_PIX_ENABLED: true,

  /**
   * Pagamento online com Cartão — desativado (apenas PIX).
   */
  ONLINE_PAYMENT_CARD_ENABLED: false,

  /**
   * Scanner de QR Code de notinha fiscal (cashback por nota).
   * Desligado: a página cashback mantém apenas carteira + histórico.
   */
  QR_RECEIPT_SCAN_ENABLED: false,
} as const;

/**
 * true quando pelo menos uma forma de pagamento online está liberada.
 * Usado para exibir (ou não) a opção "Pagar agora" no checkout.
 */
export const ONLINE_PAYMENTS_AVAILABLE =
  FEATURE_FLAGS.ONLINE_PAYMENT_PIX_ENABLED || FEATURE_FLAGS.ONLINE_PAYMENT_CARD_ENABLED;
