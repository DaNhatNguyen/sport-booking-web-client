import axios from 'axios';
import { CourtGroup } from '../types/courtGroup';

const API_BASE = process.env.REACT_APP_API_URL;

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

// Lấy danh sách sân yêu thích
export const getFavorites = async (): Promise<CourtGroup[]> => {
  const res = await api.get('/favorites');
  return res.data.result || res.data.favorites || [];
};

// Thêm sân vào danh sách yêu thích
export const addFavorite = async (courtGroupId: string | number): Promise<void> => {
  await api.post(`/favorites/${courtGroupId}`);
};

// Xóa sân khỏi danh sách yêu thích
export const removeFavorite = async (courtGroupId: string | number): Promise<void> => {
  await api.delete(`/favorites/${courtGroupId}`);
};

// Kiểm tra sân có trong danh sách yêu thích không
export const checkFavorite = async (courtGroupId: string | number): Promise<boolean> => {
  try {
    const res = await api.get(`/favorites/check/${courtGroupId}`);
    return res.data.result || res.data.isFavorite || false;
  } catch {
    return false;
  }
};



