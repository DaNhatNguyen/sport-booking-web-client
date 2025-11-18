import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;
// const API_BASE = 'http://localhost:5000/api';

// Định nghĩa kiểu dữ liệu cho User
export interface User {
  fullName: string;
  email: string;
  phoneNumber: string;
  token: string;
  [key: string]: any; // phòng trường hợp có thêm fields khác
}

// Lấy user từ localStorage
export const getStoredUser = (): User | null => {
  const stored = localStorage.getItem('user');
  return stored ? (JSON.parse(stored) as User) : null;
};

// Lưu user vào localStorage
export const saveUser = (user: User): void => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Xóa user khỏi localStorage
export const clearUser = (): void => {
  localStorage.removeItem('user');
};

// Gọi API để xác thực user từ token
export const fetchCurrentUser = async (token: string): Promise<User> => {
  const res = await axios.get(`${API_BASE}/auth/myInfo`, {
    headers: {
      Authorization: token,
    },
  });
  return res.data.user;
};

// Gọi API đăng nhập
export const loginApi = (data: { email: string; password: string }) => {
  return axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, data);
};
