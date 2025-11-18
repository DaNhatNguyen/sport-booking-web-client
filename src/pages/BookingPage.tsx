import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Modal } from 'react-bootstrap';
import { FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import {
  getAvailableTimeSlots,
  getBookingData,
  getCourtGroupById,
  getCourtsByGroupId,
} from '../services/courtService';
import { createBooking } from '../services/bookingService';
import { Court } from '../types/Court';
import { TimeSlot } from '../types/TimeSlot';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CustomButton from '../components/CustomButton';
import { Box, Divider, Group, ScrollArea, Space, Table, Text } from '@mantine/core';
import { generateTimeSlots } from '../utils/common';
import { CourtBookingTable } from '../components/CourtBookingTable';
import { IconPhoneCall, IconPhoneFilled } from '@tabler/icons-react';

const BookingPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [courtGroup, setCourtGroup] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);

  const [loading, setLoading] = useState(false);

  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  // const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Lấy nhóm sân theo id
  useEffect(() => {
    const fetchCourtGroup = async () => {
      if (groupId) {
        try {
          const data = await getCourtGroupById(groupId);
          setCourtGroup(data);
        } catch (err) {
          console.error('Lỗi lấy sân lớn:', err);
        }
      }
    };
    fetchCourtGroup();
  }, [groupId]);

  const mockBookingData = {
    booking_courts: [
      {
        id: 5,
        name: 'Sân 1',
        bookings: [
          // sân đã đặt
          {
            id: 1,
            booking_date: '2025-11-17',
            start_time: '16:00',
            end_time: '17:00',
            total_price: 50000,
          },
        ],
        prices: [
          { time_slot_id: 6, start_time: '06:00', end_time: '17:30', price: 25000 },
          { time_slot_id: 7, start_time: '17:30', end_time: '23:00', price: 50000 },
        ],
      },
      {
        id: 6,
        name: 'Sân 2',
        bookings: [],
        prices: [
          { time_slot_id: 6, start_time: '06:00', end_time: '17:30', price: 25000 },
          { time_slot_id: 7, start_time: '17:30', end_time: '23:00', price: 50000 },
        ],
      },
    ],
  };

  // Ghép địa chỉ
  const fullAddress = courtGroup
    ? `${courtGroup.address}, ${courtGroup.district}, ${courtGroup.province}`
    : '';

  return (
    <>
      <Header />
      <Container className="my-5">
        {/* Thông tin sân */}
        {courtGroup && (
          <>
            <h3 className="fw-bold">{courtGroup.name}</h3>
            <div className="text-muted mb-3">
              <FaMapMarkerAlt className="text-danger me-2" />
              {courtGroup.address}, {courtGroup.district}, {courtGroup.province}
            </div>
          </>
        )}
        <Divider />
      </Container>
      {courtGroup && <CourtBookingTable courtGroup={courtGroup} />}
      <Container className="my-4">
        {fullAddress && (
          <div className="mb-4">
            <h5 className="fw-bold">Vị trí sân</h5>
            <div className="border rounded overflow-hidden" style={{ height: '400px' }}>
              <iframe
                title="Google Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  fullAddress
                )}&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default BookingPage;
