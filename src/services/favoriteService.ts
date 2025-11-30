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
    const data = res.data;
    
    // Debug log (có thể xóa sau)
    console.log('checkFavorite response:', JSON.stringify(data));
    
    // Xử lý nested structure: {"code":1000,"result":{"result":true,"isFavorite":true}}
    if (data.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
      // Nếu result là object, check nested values
      if (data.result.result === true || data.result.isFavorite === true) {
        return true;
      }
      // Nếu nested result là false
      if (data.result.result === false || data.result.isFavorite === false) {
        return false;
      }
    }
    
    // Xử lý direct structure: {"result": true} hoặc {"isFavorite": true}
    if (data.result === true || data.isFavorite === true) {
      return true;
    }
    
    // Nếu là false hoặc undefined/null, return false
    return false;
  } catch (error) {
    // Nếu có lỗi (401, 404, etc.), coi như không phải favorite
    console.error('Error checking favorite:', error);
    return false;
  }
};




