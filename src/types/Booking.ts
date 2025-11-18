export interface Booking {
  _id: string;
  userId: string; // hoặc User nếu bạn populate
  courtId: string; // hoặc Court nếu bạn populate
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}