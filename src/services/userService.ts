import axios from 'axios';

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

export interface UpdateUserProfileData {
  fullName?: string;
  phone?: string;
  avatar?: string;
  avatarFile?: File | null;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  avatar?: string;
  role?: string;
}

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async (): Promise<UserProfile> => {
  const res = await api.get('/auth/myInfo');
  return res.data.user || res.data.result;
};

// Cập nhật thông tin người dùng
export const updateUserProfile = async (
  data: UpdateUserProfileData
): Promise<UserProfile> => {
  // Nếu có file ảnh, sử dụng FormData
  if (data.avatarFile) {
    const formData = new FormData();
    formData.append('fullName', data.fullName || '');
    if (data.phone) {
      formData.append('phone', data.phone);
    }
    formData.append('avatar', data.avatarFile);

    const res = await api.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.result || res.data.user;
  } else {
    // Nếu không có file, gửi JSON bình thường
    const { avatarFile, ...jsonData } = data;
    const res = await api.put('/users/profile', jsonData);
    return res.data.result || res.data.user;
  }
};

