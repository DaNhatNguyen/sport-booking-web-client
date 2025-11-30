export interface BookingItem {
  _id: string;
  date: string;
  booking_date?: string;
  timeSlot?: {
    startTime: string;
    endTime: string;
  };
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  courtName: string;
  courtGroupName: string;
  address?: string;
  price?: number;
}