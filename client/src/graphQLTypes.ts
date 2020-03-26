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
  city: string;
  country: string;
  email: string;
  website: string | null;
  secondaryUrl: string | null;
  logo: string | null;
  images: string[] | null;
  industry: string;
  latitude: number;
  longitude: number;
}
