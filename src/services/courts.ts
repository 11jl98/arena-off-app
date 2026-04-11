import { httpClient } from './api';
import type { Court, Sport } from '@/types/court';

export const CourtsService = {
  async listSports(): Promise<Sport[]> {
    return httpClient.get<Sport[]>('/sports');
  },

  async listCourts(sportId?: string): Promise<Court[]> {
    const params: Record<string, string> = { active: 'true' };
    if (sportId) params.sportId = sportId;
    return httpClient.get<Court[]>('/courts', { params });
  },

  async getCourt(id: string): Promise<Court> {
    return httpClient.get<Court>(`/courts/${id}`);
  },
};
