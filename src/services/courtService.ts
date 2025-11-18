import axios from 'axios';
import { CourtGroup } from '../types/courtGroup';
import { FilterParams } from '../types/filterParams';
import { Court } from '../types/Court';
import { TimeSlot } from '../types/TimeSlot';

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
  console.log('courtGroupId', courtGroupId);
  const res = await api.get(`/court-groups/court-group/${courtGroupId}/data`, {
    params: { date },
  });
  return res.data.result;
};

export interface BookingConfirmationRequest {
  courtGroupId: number;
  courtId: number;
  date: string;
  selectedSlots: Array<{ startTime: string; endTime: string }>;
}

export interface BookingConfirmationResponse {
  court_group_id: number;
  court_group_name: string;
  full_address: string;
  booking_date: string;
  court_name: string;
  time_slots: Array<{ start_time: string; end_time: string }>;
  total_price: number;
}

export const getBookingConfirmation = async (
  data: BookingConfirmationRequest
): Promise<BookingConfirmationResponse> => {
  const res = await api.post('/bookings/confirmation', data);
  return res.data.result;
};
