import { loadMercadoPago } from '@mercadopago/sdk-js';

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
const PLACEHOLDER_KEY = 'APP_USR-00000000-0000-0000-0000-000000000000';

export interface MercadoPagoCardPaymentBrickController {
  unmount: () => void;
}

export interface MercadoPagoCardPaymentBrickSettings {
  initialization: {
    amount: number;
    payer?: { email?: string; identification?: { type: string; number: string } };
  };
  customization?: {
    paymentMethods?: {
      types?: { excluded?: ('credit_card' | 'debit_card' | 'prepaid_card')[] };
    };
  };
  callbacks: {
    onReady?: () => void;
    onError?: (error: { type: string; cause: string; message: string }) => void;
    onSubmit: (
      formData: {
        token: string;
        payment_method_id: string;
        installments: number;
        payer?: {
          email?: string;
          identification?: { type: string; number: string };
        };
      },
      additionalData?: { bin?: string; lastFourDigits?: string; paymentTypeId?: string }
    ) => Promise<void>;
  };
  locale?: string;
}

export interface MercadoPagoInstance {
  bricks: () => {
    create: (
      name: 'cardPayment',
      containerId: string,
      settings: MercadoPagoCardPaymentBrickSettings
    ) => Promise<MercadoPagoCardPaymentBrickController>;
  };
  getSessionId: () => Promise<string | undefined>;
}

type MercadoPagoCtor = new (
  publicKey: string,
  options?: { locale?: string; advancedFraudPrevention?: boolean }
) => MercadoPagoInstance;

export function hasMercadoPagoPublicKey(): boolean {
  return !!MP_PUBLIC_KEY && MP_PUBLIC_KEY !== PLACEHOLDER_KEY;
}

let instancePromise: Promise<MercadoPagoInstance> | null = null;

export function getMercadoPagoInstance(): Promise<MercadoPagoInstance> {
  if (instancePromise) return instancePromise;

  instancePromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('[MERCADO PAGO] SDK só está disponível no navegador');
    }
    if (!hasMercadoPagoPublicKey()) {
      throw new Error('[MERCADO PAGO] VITE_MERCADO_PAGO_PUBLIC_KEY ausente ou placeholder');
    }

    const ctor = (await loadMercadoPago()) as MercadoPagoCtor | null;
    if (!ctor) {
      throw new Error('[MERCADO PAGO] Falha ao carregar o SDK');
    }

    return new ctor(MP_PUBLIC_KEY as string, {
      locale: 'pt-BR',
      advancedFraudPrevention: true,
    });
  })();

  return instancePromise;
}

export async function getMpSessionId(): Promise<string | undefined> {
  try {
    const mp = await getMercadoPagoInstance();
    return await mp.getSessionId();
  } catch (error) {
    console.error('[MERCADO PAGO] Falha ao obter sessionId:', error);
    return undefined;
  }
}
