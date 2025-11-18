import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { loginRequest } from '../redux/slices/authSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import loginBg from '../assets/login-bg.png';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      alert('Vui lòng nhập email hoặc số điện thoại.');
      emailRef.current?.focus();
      return;
    }

    if (!password) {
      alert('Vui lòng nhập mật khẩu.');
      passwordRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      alert('Email hoặc số điện thoại không hợp lệ.');
      emailRef.current?.focus();
      return;
    }

    dispatch(loginRequest({ email, password }));
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        height: '100vh',
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backgroundBlendMode: 'multiply',
      }}
    >
      <div
        className="bg-white rounded shadow p-4"
        style={{ position: 'relative', width: '100%', maxWidth: '400px' }}
      >
        <h5 className="fw-bold text-center">Đăng nhập</h5>
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
        <p className="text-center text-muted small">HiSPORT - Đặt lịch online sân thể thao</p>

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại hoặc email</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Nhập Email"
                value={email}
                ref={emailRef}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setEmail('')}>
                ✕
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Mật khẩu</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={password}
                ref={passwordRef}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </InputGroup>
          </Form.Group>

          <Button
            variant="success"
            className="w-100 mt-3 mb-3 d-flex align-items-center justify-content-center"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Đang đăng nhập...
              </>
            ) : (
              'ĐĂNG NHẬP'
            )}
          </Button>
          {error && <p className="text-danger text-center">{error}</p>}

          <div className="text-center small">
            <a href="#">Quên mật khẩu?</a>
            <br />
            Bạn chưa có tài khoản?{' '}
            <a href="/signup" className="fw-bold">
              Đăng ký ngay.
            </a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
