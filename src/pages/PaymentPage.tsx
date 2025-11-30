import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Divider,
  Image,
  FileInput,
  Alert,
  Progress,
  Box,
  Center,
  Badge,
  rem,
} from '@mantine/core';
import {
  IconClock,
  IconAlertCircle,
  IconCheck,
  IconUpload,
  IconBuildingBank,
  IconUser,
  IconCalendar,
  IconMapPin,
  IconReceipt,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getPaymentInfo, confirmPayment, cancelExpiredBooking } from '../services/bookingService';

interface PaymentInfo {
  bookingId: number;
  ownerBankName: string;
  ownerBankAccountNumber: string;
  ownerBankAccountName: string;
  ownerBankQrImage: string;
  totalPrice: number;
  bookingDate: string;
  timeSlots: Array<{ startTime: string; endTime: string }>;
  courtName: string;
  fullAddress: string;
  createdAt: string; // Thời gian tạo booking để tính countdown chính xác
}

const PAYMENT_TIMEOUT = 5 * 60; // 5 phút = 300 giây

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;
  console.log(bookingData);

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProofImage, setPaymentProofImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);
  const [expired, setExpired] = useState(false);

  // Handle expired booking - auto delete
  const handleExpiredBooking = async () => {
    if (!bookingData?.booking_id) return;

    try {
      await cancelExpiredBooking(bookingData.booking_id);
      notifications.show({
        title: 'Hết thời gian thanh toán',
        message: 'Đặt sân của bạn đã bị hủy do quá thời gian thanh toán',
        color: 'red',
      });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error canceling expired booking:', error);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      handleExpiredBooking(); // Gọi async function
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Fetch payment info
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!bookingData?.booking_id) {
        notifications.show({
          title: 'Lỗi',
          message: 'Không tìm thấy thông tin đặt sân',
          color: 'red',
        });
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const data = await getPaymentInfo(bookingData.booking_id);

        // Kiểm tra xem booking đã hết hạn chưa (trường hợp user thoát rồi quay lại)
        const bookingCreatedAt = new Date(data.createdAt || bookingData.created_at);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - bookingCreatedAt.getTime()) / 1000);

        if (elapsedSeconds >= PAYMENT_TIMEOUT) {
          // Booking đã hết hạn
          setExpired(true);
          setTimeLeft(0);
          await handleExpiredBooking();
          return;
        }

        // Cập nhật thời gian còn lại chính xác
        setTimeLeft(PAYMENT_TIMEOUT - elapsedSeconds);
        setPaymentInfo(data);
      } catch (error: any) {
        console.error('Error fetching payment info:', error);

        // Nếu booking không tồn tại (đã bị xóa bởi scheduled job)
        if (error?.response?.status === 404) {
          notifications.show({
            title: 'Booking đã hết hạn',
            message: 'Đặt sân của bạn đã bị hủy do quá thời gian thanh toán',
            color: 'red',
          });
          navigate('/');
          return;
        }

        notifications.show({
          title: 'Lỗi',
          message: 'Không thể lấy thông tin thanh toán',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData?.booking_id]);

  // Handle payment confirmation
  const handleConfirmPayment = async () => {
    if (!paymentProofImage) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng tải lên ảnh chuyển khoản',
        color: 'yellow',
      });
      return;
    }

    if (!bookingData?.booking_id) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('payment_proof', paymentProofImage);
      formData.append('booking_id', bookingData.booking_id.toString());

      await confirmPayment(bookingData.booking_id, formData);

      notifications.show({
        title: 'Thành công',
        message: 'Đã gửi xác nhận thanh toán. Chúng tôi sẽ xác minh và xác nhận đơn của bạn sớm!',
        color: 'green',
        icon: <IconCheck />,
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      notifications.show({
        title: 'Lỗi',
        message: error?.response?.data?.message || 'Không thể xác nhận thanh toán',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Format time countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timePercentage = (timeLeft / PAYMENT_TIMEOUT) * 100;

  if (loading) {
    return (
      <>
        <Header />
        <Container size="md" py="xl">
          <Center>
            <Text>Đang tải thông tin thanh toán...</Text>
          </Center>
        </Container>
        <Footer />
      </>
    );
  }

  if (!paymentInfo) {
    return (
      <>
        <Header />
        <Container size="md" py="xl">
          <Alert icon={<IconAlertCircle />} title="Lỗi" color="red">
            Không tìm thấy thông tin thanh toán
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Container size="lg" py="xl">
        <Title order={2} mb="xl" ta="center">
          Thanh toán đặt sân
        </Title>

        {/* Countdown Timer */}
        <Paper shadow="sm" p="lg" mb="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Group>
              <IconClock size={24} color={timeLeft < 60 ? 'red' : 'blue'} />
              <Text fw={500}>Thời gian thanh toán còn lại:</Text>
            </Group>
            <Badge size="xl" color={timeLeft < 60 ? 'red' : 'blue'}>
              {formatTime(timeLeft)}
            </Badge>
          </Group>
          <Progress
            value={timePercentage}
            color={timePercentage < 20 ? 'red' : timePercentage < 50 ? 'yellow' : 'green'}
            size="lg"
            striped
            animated
          />
          {timeLeft < 60 && (
            <Alert icon={<IconAlertCircle />} title="Cảnh báo" color="red" mt="sm">
              Thời gian thanh toán sắp hết! Đặt sân sẽ tự động bị hủy nếu không thanh toán kịp.
            </Alert>
          )}
        </Paper>

        {expired ? (
          <Alert icon={<IconAlertCircle />} title="Hết thời gian" color="red">
            Đã hết thời gian thanh toán. Đặt sân của bạn đã bị hủy.
          </Alert>
        ) : (
          <Group align="flex-start" gap="md">
            {/* Left Column - Booking Info */}
            <Box style={{ flex: 1 }}>
              <Paper shadow="sm" p="lg" withBorder>
                <Title order={4} mb="md">
                  Thông tin đặt sân
                </Title>

                <Stack gap="sm">
                  <Group>
                    <IconCalendar size={20} />
                    <div>
                      <Text size="sm" c="dimmed">
                        Ngày đặt
                      </Text>
                      <Text fw={500}>
                        {new Date(paymentInfo.bookingDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  </Group>

                  <Divider />

                  <Group>
                    <IconMapPin size={20} />
                    <div>
                      <Text size="sm" c="dimmed">
                        Tên sân
                      </Text>
                      <Text fw={500}>{paymentInfo.courtName}</Text>
                      <Text size="sm">{paymentInfo.fullAddress}</Text>
                    </div>
                  </Group>

                  <Divider />

                  <div>
                    <Group mb="xs">
                      <IconClock size={20} />
                      <Text size="sm" c="dimmed">
                        Khung giờ
                      </Text>
                    </Group>
                    {paymentInfo.timeSlots.map((slot, idx) => (
                      <Badge key={idx} size="lg" variant="outline" mr="xs" mb="xs">
                        {slot.startTime} - {slot.endTime}
                      </Badge>
                    ))}
                  </div>

                  <Divider />

                  <Group>
                    <IconReceipt size={20} />
                    <div>
                      <Text size="sm" c="dimmed">
                        Tổng tiền
                      </Text>
                      <Text fw={700} size="xl" c="blue">
                        {paymentInfo.totalPrice.toLocaleString()}đ
                      </Text>
                    </div>
                  </Group>
                </Stack>
              </Paper>

              {/* Upload Payment Proof */}
              <Paper shadow="sm" p="lg" mt="md" withBorder>
                <Title order={4} mb="md">
                  Upload ảnh chuyển khoản
                </Title>

                <FileInput
                  label="Ảnh xác nhận chuyển khoản"
                  placeholder="Chọn ảnh"
                  accept="image/*"
                  leftSection={<IconUpload size={rem(14)} />}
                  value={paymentProofImage}
                  onChange={setPaymentProofImage}
                  mb="md"
                />

                {paymentProofImage && (
                  <Box mb="md">
                    <Text size="sm" mb="xs">
                      Xem trước:
                    </Text>
                    <Image
                      src={URL.createObjectURL(paymentProofImage)}
                      alt="Payment proof preview"
                      radius="md"
                      h={200}
                      fit="contain"
                    />
                  </Box>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleConfirmPayment}
                  loading={submitting}
                  disabled={!paymentProofImage || expired}
                  leftSection={<IconCheck />}
                >
                  Xác nhận đã thanh toán
                </Button>
              </Paper>
            </Box>

            {/* Right Column - Payment Info */}
            <Box style={{ flex: 1 }}>
              <Paper shadow="sm" p="lg" withBorder>
                <Title order={4} mb="md">
                  Thông tin thanh toán
                </Title>

                <Stack gap="md">
                  <div>
                    <Group mb="xs">
                      <IconBuildingBank size={20} />
                      <Text fw={500}>Ngân hàng</Text>
                    </Group>
                    <Text size="lg" fw={600} c="blue">
                      {paymentInfo.ownerBankName}
                    </Text>
                  </div>

                  <Divider />

                  <div>
                    <Group mb="xs">
                      <IconUser size={20} />
                      <Text fw={500}>Chủ tài khoản</Text>
                    </Group>
                    <Text size="lg" fw={600}>
                      {paymentInfo.ownerBankAccountName}
                    </Text>
                  </div>

                  <Divider />

                  <div>
                    <Text fw={500} mb="xs">
                      Số tài khoản
                    </Text>
                    <Group>
                      <Text
                        size="xl"
                        fw={700}
                        c="red"
                        style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                      >
                        {paymentInfo.ownerBankAccountNumber}
                      </Text>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.ownerBankAccountNumber);
                          notifications.show({
                            title: 'Đã sao chép',
                            message: 'Số tài khoản đã được sao chép',
                            color: 'green',
                          });
                        }}
                      >
                        Sao chép
                      </Button>
                    </Group>
                  </div>

                  <Divider />

                  <div>
                    <Text fw={500} mb="xs">
                      Số tiền cần chuyển
                    </Text>
                    <Group>
                      <Text size="xl" fw={700} c="green">
                        {paymentInfo.totalPrice.toLocaleString()}đ
                      </Text>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.totalPrice.toString());
                          notifications.show({
                            title: 'Đã sao chép',
                            message: 'Số tiền đã được sao chép',
                            color: 'green',
                          });
                        }}
                      >
                        Sao chép
                      </Button>
                    </Group>
                  </div>

                  <Divider />

                  {/* QR Code */}
                  {paymentInfo.ownerBankQrImage && (
                    <div>
                      <Text fw={500} mb="xs">
                        Quét mã QR để thanh toán
                      </Text>
                      <Center>
                        <Image
                          src={`${process.env.REACT_APP_API_URL}/uploads/${paymentInfo.ownerBankQrImage}`}
                          // src={`http://localhost:8080/api/uploads/${paymentInfo.owner_bank_qr_image}`}
                          alt="QR Code thanh toán"
                          radius="md"
                          maw={300}
                        />
                      </Center>
                    </div>
                  )}
                </Stack>

                <Alert icon={<IconAlertCircle />} title="Lưu ý" color="blue" mt="md">
                  <Text size="sm">
                    • Vui lòng chuyển khoản đúng số tiền
                    <br />• Ghi nội dung: <strong>DAT SAN {paymentInfo.bookingId}</strong>
                    <br />• Sau khi chuyển khoản, upload ảnh xác nhận bên trái
                  </Text>
                </Alert>
              </Paper>
            </Box>
          </Group>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default PaymentPage;
