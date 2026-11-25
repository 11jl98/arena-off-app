interface ErrorWithStatus {
  status?: number;
  message?: string;
}

/**
 * Traduz erros de pagamento para mensagens amigáveis em pt-BR.
 * Mensagens cruas do backend são mantidas apenas como fallback final.
 */
export function getPaymentErrorMessage(
  err: unknown,
  fallback = 'Algo deu errado. Tente novamente.'
): string {
  const status = (err as ErrorWithStatus).status;
  const message = (err as ErrorWithStatus).message;

  if (!status) {
    if (message && /sem conex|internet|offline|network/i.test(message)) {
      return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
    }
    return message || fallback;
  }

  switch (status) {
    case 400:
      return 'Solicitação inválida. Verifique os dados e tente novamente.';
    case 401:
      return 'Sua sessão expirou. Entre novamente para continuar.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'Reserva não encontrada. Ela pode ter sido cancelada.';
    case 409:
      return 'A quadra não está mais disponível para o horário selecionado.';
    default:
      if (status >= 500) {
        return 'Erro no servidor. Tente novamente em instantes.';
      }
      return message || fallback;
  }
}