import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import signupBg from '../assets/login-bg.png';

interface FormData {
  email: string;
  phoneNumber: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    phoneNumber: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { email, phoneNumber, fullName, password, confirmPassword } = formData;

    if (!email) {
      alert('Vui lòng nhập email.');
      emailRef.current?.focus();
      return;
    }

    if (!phoneNumber) {
      alert('Vui lòng nhập số điện thoại.');
      phoneRef.current?.focus();
      return;
    }

    if (!fullName) {
      alert('Vui lòng nhập họ và tên.');
      nameRef.current?.focus();
      return;
    }

    if (!password) {
      alert('Vui lòng nhập mật khẩu.');
      passwordRef.current?.focus();
      return;
    }

    if (!confirmPassword) {
      alert('Vui lòng nhập lại mật khẩu.');
      confirmRef.current?.focus();
      return;
    }

    if (password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự.');
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu và xác nhận không khớp.');
      confirmRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

    if (!emailRegex.test(email)) {
      alert('Email không hợp lệ.');
      emailRef.current?.focus();
      return;
    }

    if (!phoneRegex.test(phoneNumber)) {
      alert('Số điện thoại không hợp lệ.');
      phoneRef.current?.focus();
      return;
    }

    // gọi api đăng ký
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, formData);
      alert('Đăng ký thành công');
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        height: '100vh',
        backgroundImage: `url(${signupBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backgroundBlendMode: 'multiply',
      }}
    >
      <div
        className="bg-white rounded shadow p-4"
        style={{ width: '100%', maxWidth: '400px', position: 'relative' }}
      >
        <Button
          variant="link"
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            fontSize: '20px',
            color: '#000',
            textDecoration: 'none',
          }}
        >
          &times;
        </Button>

        <h5 className="fw-bold text-center">Đăng ký</h5>
        <p className="text-center text-muted small">HIPORT - Đặt lịch online sân thể thao</p>

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                ref={emailRef}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setFormData({ ...formData, email: '' })}
              >
                ✕
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Nhập số điện thoại"
                ref={phoneRef}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setFormData({ ...formData, phoneNumber: '' })}
              >
                ✕
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tên đầy đủ</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                ref={nameRef}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setFormData({ ...formData, fullName: '' })}
              >
                ✕
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                ref={passwordRef}
              />
              <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Nhập lại mật khẩu</Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                ref={confirmRef}
              />
              <Button variant="outline-secondary" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputGroup>
          </Form.Group>

          <Button type="submit" variant="success" className="w-100">
            ĐĂNG KÝ
          </Button>

          <div className="text-center small mt-3">
            Bạn đã có tài khoản?{' '}
            <a href="/login" className="fw-bold">
              Đăng nhập
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignupPage;
