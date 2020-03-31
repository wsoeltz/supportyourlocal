export enum Source {
  firstvoucher = 'firstvoucher',
}

export interface Business {
  _id: string;
  id: string;
  externalId: string | null;
  source: Source | null;
  name: string;
  address: string;
  city: string | null;
  country: string;
  email: string | null;
  website: string | null;
  secondaryUrl: string | null;
  logo: string | null;
  images: string[] | null;
  industry: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  clickCount: number | null;
  mostRecentClick: Date;
}

export interface ClickHistory {
  business: Business;
  date: Date;
}
