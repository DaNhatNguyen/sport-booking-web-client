import React, { useEffect, useState } from 'react';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import { BookingItem } from '../types/BookingItem';
import { getBookingsByUserId } from '../services/bookingService';

interface Props {
  show: boolean;
  onHide: () => void;
  userId: string;
}

const BookingHistoryModal: React.FC<Props> = ({ show, onHide, userId }) => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!show || !userId) {
      console.log('BookingHistoryModal - Not fetching:', { show, userId });
      return;
    }

    console.log('BookingHistoryModal - Fetching bookings for userId:', userId);
    
    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBookingsByUserId(userId);
        console.log('BookingHistoryModal - Received bookings:', data);
        // The service already handles different response formats
        setBookings(data);
      } catch (error: any) {
        console.error('Lỗi khi lấy lịch đã đặt:', error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Không thể tải lịch sử đặt sân. Vui lòng thử lại.';
        setError(errorMessage);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [show, userId]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'confirmed':
        return 'text-success';
      case 'cancelled':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Lịch đã đặt của bạn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border">
              <span className="visually-hidden">Đang tải...</span>
            </Spinner>
            <p className="mt-2 text-muted">Đang tải lịch sử đặt sân...</p>
          </div>
        )}
        
        {!loading && error && (
          <Alert variant="danger" className="mb-0">
            <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}
        
        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">Bạn chưa có lịch đặt nào.</p>
          </div>
        )}
        
        {!loading && !error && bookings.length > 0 && (
          <div>
            {bookings.map((b) => (
              <div key={b._id} className="mb-3 border rounded p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold text-primary mb-0">{b.courtGroupName}</h5>
                  <span className={`badge ${getStatusColor(b.status)} bg-opacity-10 border`}>
                    {getStatusText(b.status)}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <strong>Sân:</strong> {b.courtName}
                </div>
                <div className="mb-2">
                  <strong>Thời gian:</strong> {b.timeSlot.startTime} - {b.timeSlot.endTime}
                </div>
                <div className="mb-2">
                  <strong>Ngày:</strong> {new Date(b.date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="mb-0">
                  <strong>Địa chỉ:</strong> {b.address}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default BookingHistoryModal;
