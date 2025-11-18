import { NavigateFunction } from 'react-router-dom';

export const checkLoginAndRedirect = (navigate: NavigateFunction, onSuccess: () => void) => {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    console.log('Vui lòng đăng nhập để tiếp tục!');
    navigate('/login');
    return;
  }

  try {
    const user = JSON.parse(userStr);

    if (!user.id || !user.token) {
      console.log('Thông tin đăng nhập không hợp lệ.');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }

    // Đăng nhập hợp lệ → gọi callback xử lý tiếp theo
    onSuccess();
  } catch (err) {
    console.error('Lỗi khi kiểm tra đăng nhập:', err);
    localStorage.removeItem('user');
    navigate('/login');
  }
};
