import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Anchor,
  Group,
  Box,
  Paper,
  SimpleGrid,
  ThemeIcon,
  Container,
  Divider,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconChartBar,
  IconUsers,
  IconClock,
  IconMapPin,
  IconShieldCheck,
} from '@tabler/icons-react';
import signupBg from '../assets/login-bg.png';

interface FormData {
  email: string;
  phoneNumber: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    phoneNumber: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const emailRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const confirmRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { email, phoneNumber, fullName, password, confirmPassword } = formData;

    if (!email) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập email.',
        color: 'yellow',
      });
      emailRef.current?.focus();
      return;
    }

    if (!phoneNumber) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập số điện thoại.',
        color: 'yellow',
      });
      phoneRef.current?.focus();
      return;
    }

    if (!fullName) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập họ và tên.',
        color: 'yellow',
      });
      nameRef.current?.focus();
      return;
    }

    if (!password) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập mật khẩu.',
        color: 'yellow',
      });
      passwordRef.current?.focus();
      return;
    }

    if (!confirmPassword) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập lại mật khẩu.',
        color: 'yellow',
      });
      confirmRef.current?.focus();
      return;
    }

    if (password.length < 6) {
      notifications.show({
        title: 'Mật khẩu quá ngắn',
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
        color: 'red',
      });
      passwordRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      notifications.show({
        title: 'Không khớp mật khẩu',
        message: 'Mật khẩu và xác nhận không khớp.',
        color: 'red',
      });
      confirmRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

    if (!emailRegex.test(email)) {
      notifications.show({
        title: 'Email không hợp lệ',
        message: 'Vui lòng nhập email đúng định dạng.',
        color: 'red',
      });
      emailRef.current?.focus();
      return;
    }

    if (!phoneRegex.test(phoneNumber)) {
      notifications.show({
        title: 'Số điện thoại không hợp lệ',
        message: 'Vui lòng nhập số điện thoại hợp lệ.',
        color: 'red',
      });
      phoneRef.current?.focus();
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, formData);
      notifications.show({
        title: 'Đăng ký thành công',
        message: 'Hãy đăng nhập để bắt đầu đặt sân.',
        color: 'green',
      });
      navigate('/login');
    } catch (err: any) {
      notifications.show({
        title: 'Đăng ký thất bại',
        message: err.response?.data?.message || 'Vui lòng thử lại sau.',
        color: 'red',
      });
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0E2148 0%, #147383 50%, #1a9fb8 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(60px)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: -180,
          left: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          filter: 'blur(80px)',
        }}
      />

      <Container size="lg" py="xl" style={{ position: 'relative', zIndex: 2 }}>
        <Paper radius="xl" shadow="xl" p={0} style={{ overflow: 'hidden' }}>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Box p={{ base: 'lg', md: 50 }} bg="white">
              <Stack gap="xs">
                <Group justify="space-between">
                  <div>
                    <Text fw={700} fz={32}>
                      Đăng ký
                    </Text>
                    <Text c="dimmed">Tạo tài khoản để đặt sân và quản lý lịch của bạn</Text>
                  </div>
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => navigate(-1)}
                  >
                    Quay lại
                  </Button>
                </Group>
                <form onSubmit={handleRegister}>
                  <Stack gap="md" mt="sm">
                    <TextInput
                      label="Email"
                      placeholder="Nhập email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      radius="md"
                      ref={emailRef}
                      rightSection={
                        formData.email ? (
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            onClick={() => setFormData({ ...formData, email: '' })}
                          >
                            ✕
                          </Button>
                        ) : undefined
                      }
                      required
                    />
                    <TextInput
                      label="Số điện thoại"
                      placeholder="Nhập số điện thoại"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      radius="md"
                      ref={phoneRef}
                      rightSection={
                        formData.phoneNumber ? (
                          <Button
                            variant="subtle"
                            size="compact-xs"
                            onClick={() => setFormData({ ...formData, phoneNumber: '' })}
                          >
                            ✕
                          </Button>
                        ) : undefined
                      }
                      required
                    />
                    <TextInput
                      label="Họ và tên"
                      placeholder="Nhập họ và tên"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      radius="md"
                      ref={nameRef}
                      required
                    />
                    <PasswordInput
                      label="Mật khẩu"
                      placeholder="Ít nhất 6 ký tự"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      radius="md"
                      ref={passwordRef}
                      required
                    />
                    <PasswordInput
                      label="Nhập lại mật khẩu"
                      placeholder="Nhập lại mật khẩu"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      radius="md"
                      ref={confirmRef}
                      required
                    />
                    <Button type="submit" radius="md" size="md" fullWidth>
                      Đăng ký
                    </Button>
                  </Stack>
                </form>
                <Divider my="md" />
                <Text size="sm" c="dimmed">
                  Đã có tài khoản?{' '}
                  <Anchor component={Link} to="/login" fw={600} c="#147383">
                    Đăng nhập
                  </Anchor>
                </Text>
              </Stack>
            </Box>

            <Box
              style={{
                backgroundImage: `url(${signupBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(14,33,72,0.92)',
                  color: 'white',
                }}
              />
              <Box p={{ base: 'lg', md: 60 }} style={{ position: 'relative', zIndex: 2 }}>
                <Stack gap="xl">
                  <Stack gap="sm">
                    <Text fz={40} fw={700} c="white">
                      Trải nghiệm đặt sân hiện đại
                    </Text>
                    <Text fz="lg" c="rgba(255,255,255,0.85)">
                      Tham gia cộng đồng NSPORT để đặt sân nhanh chóng, theo dõi lịch trình và nhận
                      ưu đãi độc quyền.
                    </Text>
                  </Stack>
                  <Stack gap="lg">
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconCalendarEvent size={24} />}
                        title="Đặt sân 24/7"
                        description="Đặt sân mọi lúc, theo dõi lịch trực quan"
                      />
                      <FeatureItem
                        icon={<IconChartBar size={24} />}
                        title="Theo dõi hoạt động"
                        description="Quản lý lịch sử đặt sân và hóa đơn"
                      />
                    </Group>
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconUsers size={24} />}
                        title="Cộng đồng năng động"
                        description="Kết nối với người chơi cùng đam mê"
                      />
                      <FeatureItem
                        icon={<IconClock size={24} />}
                        title="Nhắc lịch thông minh"
                        description="Nhận thông báo trước mỗi lịch đặt"
                      />
                    </Group>
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconMapPin size={24} />}
                        title="Đa dạng địa điểm"
                        description="Hàng trăm sân ở khắp tỉnh thành"
                      />
                      <FeatureItem
                        icon={<IconShieldCheck size={24} />}
                        title="An toàn & bảo mật"
                        description="Dữ liệu được bảo vệ tuyệt đối"
                      />
                    </Group>
                  </Stack>
                  <Group gap="xl" mt="lg">
                    <StatsItem value="100K+" label="Người dùng" />
                    <StatsItem value="500+" label="Sân liên kết" />
                    <StatsItem value="4.9/5" label="Đánh giá trải nghiệm" />
                  </Group>
                </Stack>
              </Box>
            </Box>
          </SimpleGrid>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignupPage;

const FeatureItem = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Group gap="md" maw={240}>
    <ThemeIcon
      size={48}
      radius="md"
      variant="light"
      color="rgba(255,255,255,0.3)"
      style={{ backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' }}
    >
      {icon}
    </ThemeIcon>
    <Box style={{ flex: 1 }}>
      <Text fw={600} c="white" mb={4}>
        {title}
      </Text>
      <Text size="sm" c="rgba(255,255,255,0.8)">
        {description}
      </Text>
    </Box>
  </Group>
);

const StatsItem = ({ value, label }: { value: string; label: string }) => (
  <Box>
    <Text size="32px" fw={700} c="white">
      {value}
    </Text>
    <Text size="sm" c="rgba(255,255,255,0.8)">
      {label}
    </Text>
  </Box>
);
