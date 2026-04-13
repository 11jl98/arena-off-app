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
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
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
  date: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  hours: number;
  clientId: string;
}

export interface AppliedPromotion {
  promotion: Promotion;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  extraHours?: number | null;
}
