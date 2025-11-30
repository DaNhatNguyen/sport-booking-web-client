export interface CourtPrice {
  id: number;
  timeSlotId: number;
  startTime: string;
  endTime: string;
  dayType: 'WEEKDAY' | 'WEEKEND';
  price: number;
}

