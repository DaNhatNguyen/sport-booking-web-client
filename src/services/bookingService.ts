import axios from 'axios';
import { Booking } from '../types/Booking';
import { BookingItem } from '../types/BookingItem';

const API_BASE = process.env.REACT_APP_API_URL;

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_BASE,
});

// Add authorization token to all requests
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const { token } = JSON.parse(storedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
  const res = await api.post('/bookings', data);
  return res.data.booking;
};

// Lấy danh sách lịch đã đặt theo userId
export const getBookingsByUserId = async (userId: string): Promise<BookingItem[]> => {
  try {
    const res = await api.get(`/bookings/user/${userId}`);
    
    // Handle different response formats from backend
    // Backend wraps response in ApiResponse with "result" field
    if (res.data.result && Array.isArray(res.data.result)) {
      return res.data.result;
    } else if (Array.isArray(res.data)) {
      return res.data;
    } else if (res.data.bookings && Array.isArray(res.data.bookings)) {
      return res.data.bookings;
    } else if (res.data.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

// Lấy thông tin thanh toán (bao gồm thông tin ngân hàng của chủ sân)
export const getPaymentInfo = async (bookingId: number): Promise<any> => {
  const res = await api.get(`/bookings/${bookingId}/payment-info`);
  return res.data.result;
};

// Xác nhận thanh toán (upload ảnh chuyển khoản)
export const confirmPayment = async (bookingId: number, formData: FormData): Promise<any> => {
  const res = await api.post(`/bookings/${bookingId}/confirm-payment`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.result;
};

// Hủy booking đã hết hạn thanh toán
export const cancelExpiredBooking = async (bookingId: number): Promise<any> => {
  const res = await api.delete(`/bookings/${bookingId}/cancel-expired`);
  return res.data.result;
};