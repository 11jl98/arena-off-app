export type PromotionType =
  | 'SPECIAL_HOURS'
  | 'HOURS_COMBO'
  | 'FIRST_BOOKING'
  | 'BIRTHDAY';

export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  discountPercent?: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  daysOfWeek?: number[]; // 0=Sun…6=Sat
  minHours?: number;
  bonusHours?: number;
  validFrom?: string;
  validUntil?: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export interface HoursPackage {
  id: string;
  name: string;
  hours: number;
  price: number;
  active: boolean;
  createdAt: string;
}

export interface CheckAllPromotionParams {
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  basePrice: number;   // valor em reais
  hours: number;
  clientId: string;
}

export interface AppliedPromotion {
  promotion: Promotion;
  originalPrice: number;   // reais
  discountAmount: number;  // reais
  finalPrice: number;      // reais
  extraHours?: number | null;
}
