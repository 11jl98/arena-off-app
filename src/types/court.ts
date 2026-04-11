export interface Sport {
  id: string;
  name: string;
  icon?: string;
  active: boolean;
  createdAt: string;
}

export interface Court {
  id: string;
  sportId: string;
  sport?: Sport;
  name: string;
  description?: string;
  pricePerHour: number;
  maxCapacity: number;
  covered: boolean;
  lighting: boolean;
  images: string[];
  active: boolean;
  displayOrder: number;
  createdAt: string;
}
