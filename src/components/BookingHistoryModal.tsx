import React, { useEffect, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
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

  useEffect(() => {
    if (!show || !userId) return;

    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await getBookingsByUserId(userId);
        setBookings(data);
      } catch (error) {
        console.error('Lỗi khi lấy lịch đã đặt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [show, userId]);

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Lịch đã đặt của bạn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-muted text-center">Bạn chưa có lịch đặt nào.</p>
        ) : (
          bookings.map((b) => (
            <div key={b._id} className="mb-3 border-bottom pb-2">
              <p className="fw-bold text-danger">{b.courtGroupName}</p>
              <p>
                Chi tiết:{' '}
                <strong>
                  {b.courtName}: {b.timeSlot.startTime} - {b.timeSlot.endTime}
                </strong>{' '}
                | Ngày <strong>{new Date(b.date).toLocaleDateString('vi-VN')}</strong>
              </p>
              <p>
                Địa chỉ: <strong>{b.address}</strong>
              </p>
              <p className="text-muted fst-italic">Trạng thái: {b.status}</p>
            </div>
          ))
        )}
      </Modal.Body>
    </Modal>
  );
};

export default BookingHistoryModal;
