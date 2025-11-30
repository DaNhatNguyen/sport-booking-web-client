import React from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { FaPhone, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.png';
import boCongThuong from '../assets/bocongthuong.png';
import CustomButton from './CustomButton';

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: '#0e5089', color: '#fff', fontSize: '0.9rem' }}>
      {/* Nội dung footer */}
      <div className="py-5">
        <Container>
          <Row className="gy-4">
            <Col md={4}>
              <img src={logo} alt="logo" height={40} className="mb-3" />
              <p>879 Giải Phóng, Hoàng Mai, Hà Nội</p>
              <p>
                <FaPhone className="me-2" />
                0985456789
              </p>
              <p>
                <FaEnvelope className="me-2" />
                nguyendanhat@gmail.com
              </p>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold mb-3">Quy định và chính sách</h6>
              <ul className="list-unstyled">
                <li>Hướng dẫn sử dụng</li>
                <li>Quy chế Hoạt động ứng dụng</li>
                <li>Thông tin về thanh toán</li>
                <li>Chính sách bảo mật thông tin cá nhân</li>
                <li>Thông tin chăm sóc khách hàng</li>
              </ul>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold mb-3">Liên kết nhanh</h6>
              <ul className="list-unstyled">
                <li>Trang chủ</li>
                <li>Dành cho đối tác</li>
                <li>Tin tức</li>
              </ul>
              <img
                src={boCongThuong}
                alt="Bộ Công Thương"
                style={{ height: '40px', marginTop: '1rem' }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Footer bottom */}
      <div className="text-center py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-light">
          Copyright © 2025 – <span className="text-danger">Nport</span>. All rights reserved.
          Designed by <span className="text-danger">DaNhatNguyen</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
