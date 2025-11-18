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
  timeSlotId: number;
  startTime: string; // đổi thành camelCase
  endTime: string; // đổi thành camelCase
  price: number;
}

export interface BookingCourt {
  id: number;
  name: string;
  bookings: Booking[];
  prices: PricingSlot[]; // dùng interface mới
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
const isBooked = (bookings: any[], slot: TimeSlot, selectedDate: Date): boolean => {
  if (!selectedDate) return false;

  const selected = dayjs(selectedDate).format('YYYY-MM-DD');

  return bookings.some((b) => {
    const bookingDate = b.bookingDate || b.booking_date;
    const start_time = b.startTime || b.start_time;
    const end_time = b.endTime || b.end_time;

    const isSameDate = dayjs(bookingDate).format('YYYY-MM-DD') === selected;

    // Kiểm tra slot có bị chồng lên booking không
    // slot.start >= b.start_time && slot.start < b.end_time
    return isSameDate && slot.start >= start_time && slot.start < end_time;
  });
};

// Add props to component
interface CourtBookingTableProps {
  courtGroup?: any; // Add court group info
}

export const CourtBookingTable: React.FC<CourtBookingTableProps> = ({ courtGroup }) => {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [bookingData, setBookingData] = useState<any>({
    id: null,
    name: '',
    bookingCourts: [],
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

  const bookingCourts = bookingData?.bookingCourts || [];
  // const { booking_courts } = data;

  const open_time = courtGroup?.openTime;
  const close_time = courtGroup?.closeTime;

  const timeSlots = useMemo(
    () => generateTimeSlots(open_time, close_time),
    [open_time, close_time]
  );

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
      alert('Vui lòng chọn khung giờ!');
      return;
    }

    // 1. Kiểm tra tất cả slot phải cùng 1 sân
    const uniqueCourts = new Set(selectedSlots.map((s) => s.court_id));
    if (uniqueCourts.size > 1) {
      alert('Bạn chỉ được phép đặt nhiều khung giờ trên cùng một sân!');
      return;
    }

    // 2. Kiểm tra các khung giờ phải liền nhau
    const sortedSlots = [...selectedSlots].sort((a, b) => a.start_time.localeCompare(b.start_time));

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (sortedSlots[i].end_time !== sortedSlots[i + 1].start_time) {
        alert('Các khung giờ phải liền kề nhau (ví dụ: 15:00–15:30, 15:30–16:00)');
        return;
      }
    }

    // 3. Lấy thông tin cần thiết
    const courtId = selectedSlots[0].court_id;
    const bookingDate = dayjs(valueDate).format('YYYY-MM-DD');
    const storedUser = localStorage.getItem('user');
    var userId;
    if (storedUser) {
      userId = JSON.parse(storedUser).id;
    }

    // 4. Gộp các khung giờ liền nhau thành các block (vd: 14:00–16:00 thay vì 4 slot 30 phút)
    const mergedSlots = mergeTimeSlots(
      sortedSlots.map((s) => ({ start_time: s.start_time, end_time: s.end_time }))
    );

    // 5. Tính tổng tiền (dùng hàm calculateTotal đã có)
    const totalPrice = calculateTotal(selectedSlots, bookingCourts || []);

    // 6. Tìm tên sân để hiển thị
    const selectedCourt = bookingCourts?.find((c: any) => c.id === courtId);
    const courtName = selectedCourt?.name || 'Sân không xác định';

    const confirmationPayload = {
      user_id: userId,
      court_id: courtId,
      booking_date: bookingDate,
      time_slots: mergedSlots, // [{ start_time: "14:00", end_time: "16:00" }, ...]
      total_price: totalPrice,
      status: 'PENDING', // hoặc 'confirmed' tùy flow
      court_name: courtName,
      full_address: courtGroup?.address || 'Đang cập nhật', // nếu có địa chỉ
    };

    // 8. Gọi API xác nhận (nếu backend có endpoint lấy preview)
    setLoading(true);
    try {
      const confirmationPayload = {
        user_id: userId,
        court_id: courtId,
        booking_date: bookingDate,
        time_slots: mergedSlots, // [{ start_time: "14:00", end_time: "16:00" }, ...]
        total_price: totalPrice,
        status: 'PENDING', // hoặc 'confirmed' tùy flow
        court_name: courtName,
        full_address: courtGroup?.address || 'Đang cập nhật', // nếu có địa chỉ
      };
      await getBookingConfirmation(confirmationPayload);

      // Nếu backend trả thêm thông tin (địa chỉ, tên, v.v.) thì ưu tiên dùng
      setConfirmationData(confirmationPayload);
    } catch (err) {
      console.error('Lỗi khi xác nhận đặt sân:', err);
      // Vẫn cho phép xem preview dù không gọi được API
      setConfirmationData(confirmationPayload);
    } finally {
      setLoading(false);
      setShowConfirmationModal(true);
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

  function getPriceByTime(prices: any[], time: string): number {
    const toMinutes = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const timeInMin = toMinutes(time);

    for (const p of prices) {
      // Hỗ trợ cả start_time và startTime
      const startTime = p.start_time || p.startTime;
      const endTime = p.end_time || p.endTime;

      if (!startTime || !endTime) continue;

      const start = toMinutes(startTime);
      const end = toMinutes(endTime);

      if (timeInMin >= start && timeInMin < end) {
        return p.price;
      }
    }

    return 0; // không tìm thấy giá
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
  const totalPrice = calculateTotal(selectedSlots, bookingCourts);

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
      <Group ml={50}>
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
            {bookingCourts.map((court: any) => (
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
                  navigate(`/payment`, {
                    state: confirmationData,
                  });
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
