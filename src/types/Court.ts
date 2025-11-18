export interface Court {
  _id: string;
  groupId: string; // hoặc CourtGroup nếu bạn muốn populate đầy đủ
  name: string;
  pricePerHour: number;
  isActive: boolean;
  createdAt: string; // hoặc Date
}