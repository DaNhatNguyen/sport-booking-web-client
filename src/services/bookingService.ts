import axios from 'axios';
import { Booking } from '../types/Booking';
import { BookingItem } from '../types/BookingItem';

const API_BASE = process.env.REACT_APP_API_URL;

interface TimeSlotInput {
  startTime: string;
  endTime: string;
}

interface CreateBookingPayload {
  courtId: string;
  date: string;
  userId: string;
  timeSlot: TimeSlotInput;
}

// Tạo mới booking
export const createBooking = async (data: CreateBookingPayload): Promise<Booking> => {
  const res = await axios.post(`${API_BASE}/bookings`, data);
  return res.data.booking;
};

// Lấy danh sách lịch đã đặt theo userId
export const getBookingsByUserId = async (userId: string): Promise<BookingItem[]> => {
  const res = await axios.get(`${API_BASE}/bookings/user/${userId}`);
  return res.data;
};
