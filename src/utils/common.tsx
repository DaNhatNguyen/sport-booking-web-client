import dayjs from 'dayjs';

// Hàm sinh khung giờ 30 phút
export const generateTimeSlots = (open: string, close: string) => {
  const slots = [];
  let [hour, minute] = open.split(':').map(Number);
  const [closeHour, closeMinute] = close.split(':').map(Number);

  while (hour < closeHour || (hour === closeHour && minute < closeMinute)) {
    const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour++;
    }
    const end = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push({ start, end });
  }
  return slots;
};

// Hàm kiểm tra khung giờ có phải đã qua không
export const isPastSlot = (slot: { start: string }, currentDate: Date = new Date()) => {
  // slot.start = "06:00", "06:30", ...
  const [hour, minute] = slot.start.split(':').map(Number);
  const slotTime = dayjs(currentDate).set('hour', hour).set('minute', minute).startOf('minute');

  // So sánh với giờ hiện tại
  return slotTime.isBefore(dayjs());
};
