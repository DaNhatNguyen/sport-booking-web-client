import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Group,
  Text,
  Button,
  Avatar,
  Menu,
  Divider,
  Modal,
  SimpleGrid,
  ScrollArea,
  Stack,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconMapPin, IconChevronDown, IconLogout, IconHistory, IconUser, IconSettings } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearUser } from '../services/authService';
import logo from '../assets/logo.png';
import BookingHistoryModal from './BookingHistoryModal';
import UserProfileModal from './UserProfileModal';
import userImg from '../assets/userImg.png';
interface Province {
  name: string;
  districts: string[];
}

interface User {
  id?: number;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  token: string;
  [key: string]: any;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [locationData, setLocationData] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Lấy dữ liệu khu vực trong file
  useEffect(() => {
    fetch('/locations.json')
      .then((res) => res.json())
      .then((data) => setLocationData(data));
  }, []);

  // Lây dữ liệu khu vực đã lưu trước đó
  useEffect(() => {
    const saved = localStorage.getItem('selectedLocation');
    if (saved) {
      const { province, district } = JSON.parse(saved);
      setSelectedProvince(province);
      setSelectedDistrict(district);
    }
  }, []);

  // Kiểm tra login
  useEffect(() => {
    const checkLogin = async () => {
      const stored = getStoredUser();
      if (!stored || !stored.token) {
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser({ ...userData, token: stored.token });
      } catch (err) {
        clearUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const buildAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return userImg;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${base}/files/court-images/${avatarPath}`;
  };

  return (
    <>
      <Paper
        radius={0}
        shadow="sm"
        px={{ base: 'md', md: 'xl' }}
        py="sm"
        withBorder
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        <Group justify="space-between" gap="lg" wrap="nowrap">
          <Group gap="sm">
            <Box component={Link} to="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="Nsport" height="40" />
            </Box>
            <Group gap="sm" visibleFrom="md">
              <Button
                component={Link}
                to="/"
                variant="subtle"
                color="dark"
                radius="md"
              >
                Trang chủ
              </Button>
              <Button
                component={Link}
                to="/collaboration"
                variant="light"
                color="green"
                radius="md"
              >
                Dành cho đối tác
              </Button>
            </Group>
          </Group>

          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button
              variant="subtle"
              color="dark"
              leftSection={<IconMapPin size={16} />}
              rightSection={<IconChevronDown size={16} />}
              onClick={() => setShowModal(true)}
              radius="md"
            >
              <Stack gap={0} align="flex-start" lh="1">
                <Text size="xs" c="dimmed">
                  Khu vực
                </Text>
                <Text size="sm">
                  {selectedDistrict && selectedProvince
                    ? `${selectedDistrict}, ${selectedProvince.name.replace(/^Tỉnh |^Thành phố /, '')}`
                    : 'Chọn khu vực'}
                </Text>
              </Stack>
            </Button>

            {loading ? null : user ? (
              <Menu shadow="md" width={220} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="light"
                    color="gray"
                    radius="xl"
                    leftSection={<Avatar src={buildAvatarUrl(user.avatar)} size={28} />}
                    rightSection={<IconChevronDown size={16} />}
                  >
                    <Text size="sm" fw={500}>
                      {user.fullName}
                    </Text>
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Tài khoản</Menu.Label>
                  <Menu.Item
                    leftSection={<IconUser size={16} />}
                    onClick={() => setShowProfile(true)}
                  >
                    Quản lý thông tin
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconHistory size={16} />}
                    onClick={() => setShowHistory(true)}
                  >
                    Lịch đã đặt
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={16} />}
                    onClick={() => {
                      clearUser();
                      setUser(null);
                      navigate('/');
                    }}
                  >
                    Đăng xuất
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap="xs">
                <Button component={Link} to="/login" variant="default" radius="md">
                  Đăng nhập
                </Button>
                <Button component={Link} to="/signup" radius="md">
                  Đăng ký
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </Paper>

      <Modal
        opened={showModal}
        onClose={() => {
          setShowModal(false);
          setStep(1);
        }}
        title={
          step === 1 ? 'Vui lòng chọn tỉnh/thành phố' : `Chọn quận/huyện tại ${selectedProvince?.name}`
        }
        size="lg"
        centered
      >
        <ScrollArea h={400}>
          {step === 1 && (
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {locationData.map((province, idx) => (
                <Paper
                  key={idx}
                  withBorder
                  radius="md"
                  p="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedProvince(province);
                    setStep(2);
                  }}
                >
                  <Stack gap={4}>
                    <Text fw={500}>{province.name}</Text>
                    <Text size="sm" c="dimmed">
                      {province.districts.length} quận/huyện
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}

          {step === 2 && selectedProvince && (
            <Stack gap="xs">
              <Group justify="space-between">
                <Button variant="subtle" size="xs" onClick={() => setStep(1)}>
                  ← Quay lại
                </Button>
                <Badge color="green" variant="light">
                  {selectedProvince.districts.length} quận/huyện
                </Badge>
              </Group>
              <Divider />
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {selectedProvince.districts.map((district, idx) => (
                  <Paper
                    key={idx}
                    withBorder
                    radius="md"
                    p="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setShowModal(false);
                      setStep(1);
                      localStorage.setItem(
                        'selectedLocation',
                        JSON.stringify({
                          province: selectedProvince,
                          district,
                        })
                      );
                      window.dispatchEvent(new Event('locationChanged'));
                    }}
                  >
                    <Text size="sm">{district}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </ScrollArea>
      </Modal>

      <BookingHistoryModal
        show={showHistory}
        onHide={() => setShowHistory(false)}
        userId={user?.id?.toString() || ''}
      />

      {user?.id && (
        <UserProfileModal
          opened={showProfile}
          onClose={() => setShowProfile(false)}
          userId={user.id}
        />
      )}
    </>
  );
};

export default Header;
