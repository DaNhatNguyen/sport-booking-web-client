import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { loginRequest } from '../redux/slices/authSlice';
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
  Image,
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
import loginBg from '../assets/login-bg.png';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập email hoặc số điện thoại.',
        color: 'yellow',
      });
      emailRef.current?.focus();
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

    if (!emailRegex.test(email) && !phoneRegex.test(email)) {
      notifications.show({
        title: 'Thông tin không hợp lệ',
        message: 'Email hoặc số điện thoại không đúng định dạng.',
        color: 'red',
      });
      emailRef.current?.focus();
      return;
    }

    dispatch(loginRequest({ email, password }));
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
            {/* Left */}
            <Box p={{ base: 'lg', md: 50 }} bg="white">
              <Stack gap="xs">
                <Group justify="space-between">
                  <div>
                    <Text fw={700} fz={32}>
                      Đăng nhập
                    </Text>
                    <Text c="dimmed">Truy cập nền tảng NSPORT quản lý sân dễ dàng</Text>
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
                <form onSubmit={handleLogin}>
                  <Stack gap="md" mt="sm">
                    <TextInput
                      label="Email hoặc số điện thoại"
                      placeholder="Nhập thông tin đăng nhập"
                      value={email}
                      ref={emailRef}
                      onChange={(e) => setEmail(e.target.value)}
                      radius="md"
                      rightSection={
                        email ? (
                          <Button variant="subtle" size="compact-xs" onClick={() => setEmail('')}>
                            ✕
                          </Button>
                        ) : undefined
                      }
                      required
                    />
                    <PasswordInput
                      label="Mật khẩu"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      ref={passwordRef}
                      onChange={(e) => setPassword(e.target.value)}
                      radius="md"
                      required
                    />
                    <Group justify="space-between" mt="xs">
                      <Text size="sm" c="dimmed">
                        Quên mật khẩu?
                      </Text>
                    </Group>
                    {error && (
                      <Text size="sm" c="red" ta="center">
                        {error}
                      </Text>
                    )}
                    <Button type="submit" radius="md" size="md" loading={loading} fullWidth>
                      Đăng nhập
                    </Button>
                  </Stack>
                </form>
                <Divider my="md" />
                <Text size="sm" c="dimmed">
                  Không có tài khoản?{' '}
                  <Anchor component={Link} to="/signup" fw={600} c="#147383">
                    Đăng ký
                  </Anchor>
                </Text>
              </Stack>
            </Box>

            {/* Right */}
            <Box
              style={{
                backgroundImage: `url(${loginBg})`,
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
              <Box
                p={{ base: 'lg', md: 60 }}
                style={{ position: 'relative', zIndex: 2 }}
              >
                <Stack gap="xl">
                  <Stack gap="sm">
                    <Text fz={40} fw={700} c="white">
                      Hệ thống quản lý sân thể thao
                    </Text>
                    <Text fz="lg" c="rgba(255,255,255,0.85)">
                      Nền tảng quản lý toàn diện cho chủ sân - dễ dàng, hiệu quả, bảo mật
                    </Text>
                  </Stack>
                  <Stack gap="lg">
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconCalendarEvent size={24} />}
                        title="Quản lý đặt sân"
                        description="Theo dõi và xác nhận booking trong 1 nơi"
                      />
                      <FeatureItem
                        icon={<IconChartBar size={24} />}
                        title="Báo cáo doanh thu"
                        description="Thống kê trực quan, chính xác theo ngày"
                      />
                    </Group>
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconUsers size={24} />}
                        title="Khách hàng & hội viên"
                        description="Lưu trữ thông tin và lịch sử đặt sân"
                      />
                      <FeatureItem
                        icon={<IconClock size={24} />}
                        title="Lịch trình linh hoạt"
                        description="Thiết lập khung giờ & giá theo nhu cầu"
                      />
                    </Group>
                    <Group gap="lg" align="flex-start">
                      <FeatureItem
                        icon={<IconMapPin size={24} />}
                        title="Đa cụm sân"
                        description="Quản lý nhiều địa điểm dễ dàng"
                      />
                      <FeatureItem
                        icon={<IconShieldCheck size={24} />}
                        title="Bảo mật cao"
                        description="Chuẩn hoá bảo mật, sao lưu dữ liệu"
                      />
                    </Group>
                  </Stack>
                  <Group gap="xl" mt="lg">
                    <StatsItem value="500+" label="Chủ sân tin dùng" />
                    <StatsItem value="10K+" label="Booking mỗi tháng" />
                    <StatsItem value="99.9%" label="Uptime hệ thống" />
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

export default LoginPage;

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
