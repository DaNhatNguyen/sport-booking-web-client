import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { confirmBooking } from '../services/courtService';

interface PaymentState {
  booking_id?: number;
  court_group_id?: number;
  court_name: string;
  full_address: string;
  booking_date: string;
  time_slots: { start_time: string; end_time: string }[];
  total_price: number;
}

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state || {}) as PaymentState;

  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    const doConfirm = async () => {
      if (!state.booking_id) return;
      try {
        await confirmBooking(state.booking_id);
        setBookingConfirmed(true);
      } catch (err) {
        console.error('Lỗi xác nhận booking:', err);
        setConfirmError('Không thể xác nhận đơn đặt sân. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
      }
    };

    doConfirm();
  }, [state.booking_id]);

  return (
    <>
      <Header />
      <Container className="my-4">
        <Row>
          <Col md={12}>
            <h3 className="fw-bold mb-3">Thanh toán</h3>

            {state.court_name && (
              <>
                <p className="mb-1">
                  <strong>Sân:</strong> {state.court_name}
                </p>
                <p className="mb-1">
                  <strong>Địa chỉ:</strong> {state.full_address}
                </p>
                <p className="mb-1">
                  <strong>Ngày:</strong>{' '}
                  {state.booking_date
                    ? new Date(state.booking_date).toLocaleDateString('vi-VN')
                    : 'Đang cập nhật'}
                </p>
                <p className="mb-1">
                  <strong>Khung giờ:</strong>{' '}
                  {state.time_slots
                    ?.map((s) => `${s.start_time} - ${s.end_time}`)
                    .join(', ') || 'Đang cập nhật'}
                </p>
                <p className="mb-3">
                  <strong>Tổng tiền:</strong> {state.total_price?.toLocaleString()}đ
                </p>
              </>
            )}

            {confirmError && <Alert variant="danger">{confirmError}</Alert>}
            {bookingConfirmed && !confirmError && (
              <Alert variant="success">Đơn đặt sân đã được xác nhận (CONFIRMED).</Alert>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default PaymentPage;
