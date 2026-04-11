const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const CACHE_TIME = {
  DEFAULT: 30 * MINUTE,
  PROFILE: 2 * 60 * MINUTE,
  SCHEDULE: 60 * MINUTE,
  SHORT: 15 * MINUTE,
} as const;

export const STALE_TIME = {
  DEFAULT: 5 * MINUTE,
  PROFILE: 15 * MINUTE,
  SCHEDULE: 15 * MINUTE,
  SHORT: 2 * MINUTE,
} as const;
