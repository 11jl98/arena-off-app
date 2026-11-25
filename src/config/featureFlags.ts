/**
 * Feature Flags
 *
 * Controla a ativação/desativação de funcionalidades em rollout gradual.
 * Os pagamentos online serão liberados em breve, por partes.
 *
 * Para liberar o PIX, altere ONLINE_PAYMENT_PIX_ENABLED para `true`.
 * Para liberar o Cartão (crédito/débito), altere ONLINE_PAYMENT_CARD_ENABLED para `true`.
 */
export const FEATURE_FLAGS = {
  /**
   * Pagamento online via PIX — botão PIX no seletor de forma de pagamento.
   * Altere para `true` para liberar.
   */
  ONLINE_PAYMENT_PIX_ENABLED: false,

  /**
   * Pagamento online com Cartão (crédito e débito) — botões de cartão no
   * seletor de forma de pagamento.
   * Altere para `true` para liberar.
   */
  ONLINE_PAYMENT_CARD_ENABLED: false,
} as const;

/**
 * true quando pelo menos uma forma de pagamento online está liberada.
 * Usado para exibir (ou não) a opção "Pagar agora" no checkout.
 */
export const ONLINE_PAYMENTS_AVAILABLE =
  FEATURE_FLAGS.ONLINE_PAYMENT_PIX_ENABLED || FEATURE_FLAGS.ONLINE_PAYMENT_CARD_ENABLED;
