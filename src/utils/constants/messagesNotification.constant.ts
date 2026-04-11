export const MESSAGES_INFORMATION = {
  CONFIRM_ABSENCE: 'Você tem certeza que deseja registrar sua ausência para esta aula?',
  CONFIRM_ABSENCE_NO_REPLACEMENT:
    'Atenção! Falta menos de 1h30 para a aula. Cancelar agora NÃO gerará direito a reposição. Deseja continuar mesmo assim?',
  ABSTENCE_HOUR_INVALID:
    'Infelizmente seu tempo para realizar troca já passou. Respeite as 1h:30min antes da aula.',
  CATEGORY_DIFERENT: 'Sua categoria não permite registrar reposição para esta aula. Ambos divergem',
  NO_CLASSES_TO_RESCHEDULE: 'Nenhuma aula disponível para reagendamento.',
  INSUFFICIENT_CREDITS: 'Créditos insuficientes para realizar o reagendamento.',
  MAX_STUDENTS_REACHED: 'Número máximo de alunos atingido para esta aula.',
  PERSONALIZED_CLASS_REQUIRES_PERSONALIZED_PLAN:
    'Apenas alunos com plano personalizado podem entrar nesta aula.',
  PERSONALIZED_CLASS_FULL: 'Esta aula personalizada já atingiu o limite de 4 alunos.',
  CLASS_TYPE_MISMATCH_FOR_REPLACEMENT:
    'Você só pode fazer reposição em aulas do mesmo tipo. Aulas personalizadas devem ser repostas em aulas personalizadas, e aulas normais em aulas normais.',
  CLASS_ALREADY_HAS_ABSENCE: 'Quer voltar para esta aula?',
  CONFIRM_CANCEL_ABSENCE: 'Deseja voltar para esta aula? Isso cancelará sua ausência.',
  CONFIRM_CANCEL_REPLACEMENT: 'Deseja cancelar a reposição? Seu crédito será liberado.',
  CANNOT_CANCEL_ABSENCE_IN_USE:
    'Não é possível voltar para esta aula pois você já fez uma reposição.',
  CANNOT_ABSENCE_REPORT: 'Você não tem nenhuma reposição para fazer no momento.',
  IS_FIRST_ACCESS:
    'Parece que é seu primeiro acesso volte a tela de inicio e clique em "Primeiro acesso? clique aqui".',
  IS_RESET_PASSWORD:
    'Parece que você precisa redefinir sua senha. Volte à tela de início e clique em "Esqueci minha senha".',
  IMAGE_RESIZING: 'Redimensionando imagem...',
  CONFIRM_CANCEL_EXTRA_CLASS: 'Tem certeza que deseja cancelar esta aula avulsa? Esta ação não pode ser desfeita.',
};

export const MESSAGES_ERROR = {
  DEFAUL_ERROR: 'Ocorreu um erro. Tente novamente.',
  LOGIN_MESSAGE: 'Email ou senha não correspondem. \n Tente novamente!',
  ERROR_REGISTERING_ABSENCE: 'Erro ao registrar ausência',
  ERROR_PROFILE: 'Erro ao carregar informações do perfil. \n Tente novamente!.',
  ERROR_CANCEL_ABSENCE: 'Erro ao cancelar ausência. Tente novamente.',
  ERROR_CANCEL_REPLACEMENT: 'Erro ao cancelar reposição. Tente novamente.',
  VALIDATE_DOCUMENT: 'Não foi possivel validar documento. Tente novamente.',
  INVALIDE_EXPIRRED_OTP: 'Código expirado ou inválido!',
  PASSWORD_RESET_ERROR: 'Erro ao redefinir a senha. Tente novamente.',
  DOCUMENT_NOT_FOUND: 'Documento não encontrado. Verifique e tente novamente.',
  EXIST_PASSWORD_RESET_REQUEST: 'Usuário já realizou seu primeiro acesso.',
  USER_PROFILE_UPDATE_ERROR: 'Erro ao atualizar o perfil. Tente novamente.',
  BLOKED_USER:
    'Você está com o acesso bloqueado. Entre em contato com o Vibra e regularize sua situação.',
  INACTIVE_USER: 'Você está inativo. Entre em contato com o Vibra.',
  IMAGE_VALIDATION_ERROR: 'Não foi possível validar a imagem. Verifique o arquivo e tente novamente.',
  IMAGE_PROCESSING_ERROR: 'Não foi possível processar a imagem. Tente selecionar outra foto.',
  BLOCKED_ACCOUNT_SCHEDULE: 'Sua conta está bloqueada. Regularize seu pagamento para gerenciar aulas.',
  BLOCKED_ACCOUNT_RESCHEDULE: 'Sua conta está bloqueada. Regularize seu pagamento para reagendar aulas.',
  BLOCKED_ACCOUNT_POST: 'Sua conta está bloqueada. Você não pode criar posts no momento.',
  PAYMENT_LINK_ERROR: 'Erro ao gerar link de pagamento',
  RECEIPT_DELETE_ERROR: 'Erro ao remover comprovante',
  EXTRA_CLASS_CANCEL_ERROR: 'Erro ao cancelar aula avulsa',
  EXTRA_CLASS_GENERATE_ERROR: 'Erro ao gerar pagamento de aula avulsa',
};

export const MESSAGES_SUCCESS = {
  SUCCESS_REGISTERING_ABSENCE: 'Reposição registrada com sucesso.',
  SUCCESS_CANCEL_ABSENCE: 'Você voltou para a aula com sucesso!',
  SUCCESS_CANCEL_REPLACEMENT: 'Reposição cancelada. Crédito liberado.',
  PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso.',
  USER_PROFILE_UPDATED: 'Perfil atualizado com sucesso.',
  PAYMENT_LINK_GENERATED: 'Link de pagamento gerado!',
  RECEIPT_DELETED: 'Comprovante removido com sucesso!',
  EXTRA_CLASS_CANCELLED: 'Aula avulsa cancelada com sucesso!',
};
