import { httpClient } from './api';
import type {
  Promotion,
  HoursPackage,
  CheckAllPromotionParams,
  AppliedPromotion,
} from '@/types/promotion';

export const PromotionsService = {
  async listPromotions(): Promise<Promotion[]> {
    return httpClient.get<Promotion[]>('/promotions');
  },



  async checkAll(params: CheckAllPromotionParams): Promise<AppliedPromotion[]> {
    return httpClient.post<AppliedPromotion[]>('/promotion-application/check-all', params);
  },

  async calculateDiscount(
    promotionId: string,
    basePrice: number
  ): Promise<{ discountAmount: number; finalPrice: number }> {
    return httpClient.post<{ discountAmount: number; finalPrice: number }>(
      '/promotion-application/calculate',
      { promotionId, basePrice }
    );
  },

  async listHoursPackages(): Promise<HoursPackage[]> {
    return httpClient.get<HoursPackage[]>('/hours-packages');
  },
};
