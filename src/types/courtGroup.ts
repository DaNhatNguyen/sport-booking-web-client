export interface CourtGroup {
  _id: string;
  name: string;
  type: string;
  address: string;
  district: string;
  province: string;
  phoneNumber?: string;
  images: string[];
  openTime: string;
  closeTime: string;
  rating: number;
  description?: string;
}