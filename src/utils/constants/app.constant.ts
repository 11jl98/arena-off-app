export const APP_NAME = 'Arena Off Beach';
export const APP_VERSION = 'v1.0.0';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const MERCADO_PAGO_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  HOME: '/app/reservas',
  RESERVAS: '/app/reservas',
  CASHBACK: '/app/cashback',
  PERFIL: '/app/perfil',
  PAYMENT_RETURN: '/app/pagamento/retorno',
} as const;

export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme',
} as const;

export const ARENA_CONTACT = {
  WHATSAPP_NUMBER: '553138741619',
  WHATSAPP_LINK: 'https://wa.me/553138741619',
  CANCELLATION_HOURS: 6,
} as const;
