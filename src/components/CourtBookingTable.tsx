import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Table,
  ScrollArea,
  Group,
  Text,
  Box,
  Space,
  Flex,
  Stack,
  Divider,
  Modal,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { generateTimeSlots, isPastSlot } from '../utils/common';
import { useNavigate } from 'react-router-dom';
import { getBookingConfirmation, getBookingData } from '../services/courtService';

export interface Booking {
  id: number;
  start_time: string; // "16:00"
  end_time: string; // "17:00"
  total_price: number;
  booking_date: string;
}

export interface PricingSlot {
  start_time: string;
  end_time: string;
  price: number;
}

export interface BookingCourt {
  id: number;
  name: string;
  bookings: Booking[];
  prices: PricingSlot[];
}

export interface FieldData {
  booking_courts: BookingCourt[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

type SelectedSlot = {
  court_id: number;
  date: string;
  start_time: string;
  end_time: string;
};

// Kiểm tra slot có bị đặt chưa
const isBooked = (bookings: Booking[], slot: TimeSlot, selectedDate: Date): boolean => {
  const selected = dayjs(selectedDate).format('YYYY-MM-DD');
  return bookings.some((b) => {
    const bookingDate = dayjs(b.booking_date).format('YYYY-MM-DD');
    return bookingDate === selected && slot.start >= b.start_time && slot.start < b.end_time;
  });
};

// Add props to component
interface CourtBookingTableProps {
  data: FieldData;
  courtGroup?: any; // Add court group info
}

export const CourtBookingTable: React.FC<CourtBookingTableProps> = ({ data, courtGroup }) => {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [bookingData, setBookingData] = useState<any>({
    id: null,
    name: '',
    booking_courts: [],
  });

  // Add state for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [valueDate, setValueDate] = useState<Date | null>(new Date());

  const navigate = useNavigate();

  // fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      const formattedDate = dayjs(valueDate).format('YYYY-MM-DD');

      if (courtGroup._id && formattedDate) {
        setLoading(true);
        try {
          const bookingData = await getBookingData(courtGroup._id, formattedDate);
          setBookingData(bookingData);
        } catch (err) {
          console.error('Lỗi khi load dữ liệu đặt sân:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchBookingData();
  }, [courtGroup.id, valueDate]);

  // const { booking_courts } = bookingData;
  const { booking_courts } = data;

  const open_time = courtGroup?.openTime;
  const close_time = courtGroup?.closeTime;

  console.log('open_time, close_time', open_time, close_time);

  const timeSlots = useMemo(
    () => generateTimeSlots(open_time, close_time),
    [open_time, close_time]
  );

  console.log(timeSlots);

  const handleSelectSlot = (courtId: number, slot: TimeSlot) => {
    if (!valueDate) return; // nếu chưa chọn ngày

    const newSlot: SelectedSlot = {
      court_id: courtId,
      date: valueDate.toISOString(),
      start_time: slot.start,
      end_time: slot.end,
    };

    setSelectedSlots((prev) => {
      const exists = prev.some(
        (s) =>
          s.court_id === newSlot.court_id &&
          s.start_time === newSlot.start_time &&
          s.end_time === newSlot.end_time
      );
      return exists
        ? prev.filter(
            (s) =>
              !(
                s.court_id === newSlot.court_id &&
                s.start_time === newSlot.start_time &&
                s.end_time === newSlot.end_time
              )
          )
        : [...prev, newSlot];
    });
  };

  const goToPreviousDay = () => {
    if (valueDate) {
      setValueDate(dayjs(valueDate).subtract(1, 'day').toDate());
    } else {
      setValueDate(dayjs().subtract(1, 'day').toDate());
    }
  };

  const goToNextDay = () => {
    if (valueDate) {
      setValueDate(dayjs(valueDate).add(1, 'day').toDate());
    } else {
      setValueDate(dayjs().add(1, 'day').toDate());
    }
  };

  type PriceSlot = {
    start_time: string;
    end_time: string;
    price: number;
  };

  type BookingCourt = {
    id: number;
    name: string;
    prices: PriceSlot[];
  };

  const handleBookingClick = async () => {
    if (selectedSlots.length === 0 || !valueDate) {
      return;
    }

    // Kiểm tra tất cả slot đều cùng sân
    const uniqueCourts = new Set(selectedSlots.map((s) => s.court_id));
    if (uniqueCourts.size > 1) {
      alert('Bạn chỉ được phép đặt nhiều khung giờ trên cùng một sân!');
      return;
    }

    // Kiểm tra các slot có liền nhau không
    const sortedSlots = [...selectedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];

      if (current.end_time !== next.start_time) {
        alert('Các khung giờ phải liền nhau (ví dụ: 15:00-15:30, 15:30-16:00)');
        return;
      }
    }

    // Group slots by court
    const slotsByCourt = selectedSlots.reduce((acc, slot) => {
      if (!acc[slot.court_id]) {
        acc[slot.court_id] = [];
      }
      acc[slot.court_id].push({
        startTime: slot.start_time,
        endTime: slot.end_time,
      });
      return acc;
    }, {} as Record<number, Array<{ startTime: string; endTime: string }>>);

    const firstCourtId = Object.keys(slotsByCourt)[0];
    if (!firstCourtId) return;

    setLoading(true);
    try {
      console.log({
        courtGroupId: courtGroup.id,
        courtId: parseInt(firstCourtId),
        date: valueDate.toISOString().split('T')[0],
        selectedSlots: slotsByCourt[parseInt(firstCourtId)],
      });
      const confirmation = await getBookingConfirmation({
        courtGroupId: courtGroup.id,
        courtId: parseInt(firstCourtId),
        date: valueDate.toISOString().split('T')[0],
        selectedSlots: slotsByCourt[parseInt(firstCourtId)],
      });

      setConfirmationData(confirmation);
      setShowConfirmationModal(true);
    } catch (err) {
      console.error('Lỗi khi lấy thông tin xác nhận:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add function to merge consecutive time slots
  const mergeTimeSlots = (slots: Array<{ start_time: string; end_time: string }>) => {
    if (slots.length === 0) return [];

    const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const merged: Array<{ start_time: string; end_time: string }> = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      if (current.end_time === next.start_time) {
        current = { start_time: current.start_time, end_time: next.end_time };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
    return merged;
  };

  function getPriceByTime(prices: PriceSlot[], time: string): number {
    // Hàm chuyển "HH:mm" -> phút
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const timeInMin = toMinutes(time);

    for (const p of prices) {
      const start = toMinutes(p.start_time);
      const end = toMinutes(p.end_time);

      if (timeInMin >= start && timeInMin < end) {
        return p.price;
      }
    }

    return 0;
  }

  function calculateTotal(selectedSlots: SelectedSlot[], bookingCourts: BookingCourt[]): number {
    let total = 0;

    selectedSlots.forEach((slot) => {
      const court = bookingCourts.find((c) => c.id === slot.court_id);
      if (!court) return;

      const price = getPriceByTime(court.prices, slot.start_time);
      total += price;
    });

    return total;
  }
  const totalPrice = calculateTotal(selectedSlots, booking_courts);

  return (
    <>
      <Flex justify={'center'}>
        <Group mb={16} align="center">
          <Button variant="default" onClick={goToPreviousDay}>
            <IconChevronLeft size={20} />
          </Button>

          <DateInput
            leftSection={<IconCalendar size={18} />}
            placeholder="Chọn ngày"
            locale="vi"
            value={valueDate}
            valueFormat="DD/MM/YYYY"
            dateParser={(input) => {
              if (!input) return null;
              const trimmed = input.trim();
              const parsed = dayjs(trimmed, ['DD/MM/YYYY', 'D/M/YYYY'], true);
              return parsed.isValid() ? parsed.toDate() : null;
            }}
            onChange={(inputString) => {
              // inputString là string | null
              if (!inputString) {
                setValueDate(null);
                return;
              }
              const trimmed = inputString.trim();
              const parsed = dayjs(trimmed, ['DD/MM/YYYY', 'D/M/YYYY'], true);
              setValueDate(parsed.isValid() ? parsed.toDate() : null);
            }}
            defaultDate={valueDate || new Date()}
            style={{ minWidth: 150 }}
            popoverProps={{ withinPortal: true }}
          />

          <Button variant="default" onClick={goToNextDay}>
            <IconChevronRight size={20} />
          </Button>
        </Group>
      </Flex>
      <Group>
        <Group>
          <Box
            w={20}
            h={20}
            style={{ backgroundColor: '#fff', borderRadius: 5, border: 'solid 1px #333' }}
          ></Box>
          <Text>Trống</Text>
        </Group>
        <Group>
          <Box
            w={20}
            h={20}
            style={{ backgroundColor: 'rgb(248, 113, 113)', borderRadius: 5 }}
          ></Box>
          <Text>Đã Đặt</Text>
        </Group>
        <Group>
          <Box w={20} h={20} style={{ backgroundColor: '#aca6a6ff', borderRadius: 5 }}></Box>
          <Text>Khóa</Text>
        </Group>
      </Group>
      <ScrollArea type="hover" scrollbars="x">
        <Box h={40}>&nbsp;</Box>
        <Table
          withTableBorder
          withColumnBorders
          withRowBorders
          styles={{
            th: { padding: 0 },
            td: { padding: 0 },
          }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ minWidth: 80 }} />
              {timeSlots.map((slot) => (
                <Table.Th
                  key={slot.start}
                  style={{ textAlign: 'center', minWidth: 80, position: 'relative' }}
                >
                  <Text
                    style={{
                      position: 'absolute',
                      top: -25,
                      left: -20,
                    }}
                  >
                    {slot.start}
                  </Text>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {booking_courts.map((court: any) => (
              <Table.Tr key={court.id}>
                <Table.Td align="center" style={{ backgroundColor: 'rgb(210, 247, 229)' }}>
                  <Text>{court.name}</Text>
                </Table.Td>
                {timeSlots.map((slot) => {
                  // Kiểm tra valueDate có tồn tại không
                  if (!valueDate) {
                    // Nếu chưa chọn ngày → không tính booked/past
                    return <div>Chọn ngày để xem lịch</div>;
                  }

                  const booked = isBooked(court.bookings, slot, valueDate);
                  const selected = selectedSlots.some(
                    (s) =>
                      s.court_id === court.id &&
                      s.start_time === slot.start &&
                      s.end_time === slot.end
                  );
                  const isPast = isPastSlot(slot, valueDate);

                  return (
                    <Table.Td key={slot.start} style={{ textAlign: 'center' }}>
                      <Button
                        style={{
                          border: 'none',
                          borderRadius: 0,
                          backgroundColor: booked
                            ? 'rgb(248, 113, 113)'
                            : selected
                            ? '#39c03bff'
                            : isPast
                            ? '#aca6a6ff'
                            : '#fff',
                          color: 'white',
                          height: 40,
                        }}
                        w={'100%'}
                        disabled={booked || isPast}
                        onClick={() => handleSelectSlot(court.id, slot)}
                      >
                        &nbsp;
                      </Button>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Space h={20} />
      </ScrollArea>
      <Button
        variant="filled"
        w="100%"
        onClick={handleBookingClick}
        disabled={selectedSlots.length === 0 || loading}
      >
        {loading
          ? 'Đang xử lý...'
          : totalPrice > 0
          ? `Tổng giá: ${totalPrice.toLocaleString()}đ`
          : 'Vui lòng chọn sân và chọn giờ'}
      </Button>
      <Modal
        opened={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Thông tin đặt sân"
        size="lg"
        centered
      >
        {confirmationData && (
          <Stack gap="md">
            <div>
              <Text size="sm" c="dimmed">
                Ngày đặt
              </Text>
              <Text fw={500}>
                {new Date(confirmationData.booking_date).toLocaleDateString('vi-VN')}
              </Text>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed">
                Tên sân
              </Text>
              <Text fw={500}>{confirmationData.court_name}</Text>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed">
                Địa chỉ
              </Text>
              <Text fw={500}>{confirmationData.full_address}</Text>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed">
                Khung giờ
              </Text>
              {mergeTimeSlots(confirmationData.time_slots).map((slot, idx) => (
                <Text key={idx} fw={500}>
                  {slot.start_time} - {slot.end_time}
                </Text>
              ))}
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed">
                Tổng giá
              </Text>
              <Text fw={500} size="lg" c="blue">
                {confirmationData.total_price.toLocaleString()}đ
              </Text>
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={() => {
                  // setShowConfirmationModal(true);
                  // console.log('confirmationData', confirmationData);
                  // console.log('selectedSlots', selectedSlots);
                  // Navigate to payment page
                  // navigate(`/payment`, {
                  //   state: {
                  //     court_group_id: confirmationData.id,
                  //     court_id: parseInt(firstCourtId),
                  //     bookingData: confirmationData,
                  //     selectedSlots: selectedSlots,
                  //   },
                  // });
                }}
              >
                Tiếp tục
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
};
