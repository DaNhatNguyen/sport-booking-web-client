import axios from 'axios';
import { CourtGroup } from '../types/courtGroup';
import { FilterParams } from '../types/filterParams';
import { Court } from '../types/Court';
import { TimeSlot } from '../types/TimeSlot';
import { Review } from '../types/Review';

const API_BASE = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE,
});

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

export const getCourtGroupsByLocation = async (
  province: string,
  district: string
): Promise<CourtGroup[]> => {
  const res = await api.get('/court-groups', {
    params: { province, district },
  });
  return res.data.result;
};

export const searchCourtGroups = async (
  type: string,
  city: string,
  district: string
): Promise<CourtGroup[]> => {
  const res = await api.get('/courts/search', {
    params: { type, city, district },
  });
  return res.data;
};

export const getCourtGroupsByFilter = async (
  type: string,
  city: string,
  district: string
): Promise<CourtGroup[]> => {
  const res = await api.get('/courts/filter', {
    params: { type, city, district },
  });
  return res.data;
};

export const getCourtGroupById = async (groupId: string): Promise<CourtGroup> => {
  const res = await api.get(`/court-groups/${groupId}`);
  return res.data.result;
};

export const getCourtsByGroupId = async (groupId: string): Promise<Court[]> => {
  const res = await api.get('/courts', {
    params: { groupId },
  });
  return res.data;
};

export const getAvailableTimeSlots = async (courtId: string, date: string): Promise<TimeSlot[]> => {
  const res = await api.get(`/courts/${courtId}/available-time-slots`, {
    params: { date },
  });
  return res.data;
};

// Add to courtService.ts

export interface BookingData {
  id: number;
  name: string;
  default_price: number;
  booking_courts: BookingCourt[];
}

export interface BookingCourt {
  id: number;
  name: string;
  bookings: BookingSlot[];
  prices: PricingSlot[];
}

export interface BookingSlot {
  id: number;
  start_time: string;
  end_time: string;
  total_price: number;
}

export interface PricingSlot {
  time_slot_id: number;
  start_time: string;
  end_time: string;
  price: number;
}

export const getBookingData = async (courtGroupId: string, date: string): Promise<BookingData> => {
  const res = await api.get(`/bookings/${courtGroupId}/data`, {
    params: { date },
  });
  return res.data.result;
};

export const getBookingConfirmation = async (data: any): Promise<any> => {
  const res = await api.post('/bookings/confirmation', data);
  return res.data.result;
};

export const confirmBooking = async (bookingId: number): Promise<any> => {
  const res = await api.post(`/bookings/${bookingId}/confirm`);
  return res.data.result;
};

export const getReviews = async (courtGroupId: string | number): Promise<Review[]> => {
  const res = await api.get(`/reviews/${courtGroupId}`);
  return res.data.result;
};

export const createReview = async (payload: {
  courtGroupId: number | string;
  rating: number;
  comment?: string;
}): Promise<Review> => {
  const res = await api.post(`/reviews/court-groups/${payload.courtGroupId}`, null, {
    params: { rating: payload.rating, comment: payload.comment },
  });
  return res.data.result;
};

export const getTopRatedCourts = async (limit: number = 4): Promise<CourtGroup[]> => {
  const res = await api.get('/court-groups/top-rated', {
    params: { limit },
  });
  return res.data.result;
};