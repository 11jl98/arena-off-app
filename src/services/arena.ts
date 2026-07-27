import { httpClient } from './api';
import type { ArenaSettings } from '@/types/arena';

export const ArenaService = {
  async getSettings(): Promise<ArenaSettings> {
    return httpClient.get<ArenaSettings>('/arena-settings');
  },
};
