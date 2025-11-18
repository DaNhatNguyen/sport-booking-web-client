export interface BookingItem {
  _id: string;
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  courtName: string;
  courtGroupName: string;
  address: string;
}