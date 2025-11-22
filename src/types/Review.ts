export interface Review {
  id: number;
  userId: number;
  userName?: string;
  courtGroupId: number;
  bookingId: number;
  rating: number;
  comment?: string;
  createdAt?: string;
}


