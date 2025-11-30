import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Card,
  Badge,
  SimpleGrid,
  Image,
  Loader,
  Alert,
  ScrollArea,
  Divider,
  ActionIcon,
  Avatar,
  Title,
  FileButton,
  Center,
} from '@mantine/core';
import {
  IconUser,
  IconHistory,
  IconHeart,
  IconMapPin,
  IconClock,
  IconStarFilled,
  IconX,
  IconEdit,
  IconCheck,
  IconPhoto,
  IconTrash,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, getCurrentUser } from '../services/userService';
import { getBookingsByUserId } from '../services/bookingService';
import { getFavorites, addFavorite, removeFavorite } from '../services/favoriteService';
import { CourtGroup } from '../types/courtGroup';
import { BookingItem } from '../types/BookingItem';
import { getStoredUser, saveUser } from '../services/authService';
import defaultCourtImage from '../assets/default-court-image.png';
import userImg from '../assets/userImg.png';

interface UserProfileModalProps {
  opened: boolean;
  onClose: () => void;
  userId: number;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ opened, onClose, userId }) => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile tab
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // History tab
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Favorites tab
  const [favorites, setFavorites] = useState<CourtGroup[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const navigate = useNavigate();

  const buildCourtImageUrl = (image?: string) => {
    if (!image) return defaultCourtImage;
    if (image.startsWith('http')) return image;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${base}/files/court-images/${image}`;
  };

  const buildAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return userImg;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${base}/files/court-images/${avatarPath}`;
  };

  // Load user profile
  useEffect(() => {
    if (opened && activeTab === 'profile') {
      loadUserProfile();
    }
  }, [opened, activeTab, userId]);

  // Load bookings
  useEffect(() => {
    if (opened && activeTab === 'history') {
      loadBookings();
    }
  }, [opened, activeTab, userId]);

  // Load favorites
  useEffect(() => {
    if (opened && activeTab === 'favorites') {
      loadFavorites();
    }
  }, [opened, activeTab, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.phoneNumber || '');
      setAvatar(user.avatar || null);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải thông tin người dùng.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      const data = await getBookingsByUserId(userId.toString());
      setBookings(data);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải lịch sử đặt sân.',
        color: 'red',
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const data = await getFavorites();
      setFavorites(data);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tải danh sách yêu thích.',
        color: 'red',
      });
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatar(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedUser = await updateUserProfile({
        fullName,
        phone,
        avatarFile,
      });

      // Update localStorage
      const storedUser = getStoredUser();
      if (storedUser) {
        saveUser({ ...storedUser, ...updatedUser });
      }

      // Reset avatar preview after save
      setAvatar(updatedUser.avatar || null);
      setAvatarFile(null);
      setAvatarPreview(null);

      notifications.show({
        title: 'Thành công',
        message: 'Cập nhật thông tin thành công.',
        color: 'green',
      });

      setEditing(false);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Không thể cập nhật thông tin.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (courtGroupId: string) => {
    try {
      await removeFavorite(courtGroupId);
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa khỏi danh sách yêu thích.',
        color: 'green',
      });
      loadFavorites();
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể xóa khỏi danh sách yêu thích.',
        color: 'red',
      });
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      CANCELLED: 'Đã hủy',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: 'yellow',
      CONFIRMED: 'green',
      CANCELLED: 'red',
      pending: 'yellow',
      confirmed: 'green',
      cancelled: 'red',
    };
    return colorMap[status] || 'gray';
  };

  const handleCourtClick = (courtId: string) => {
    onClose();
    navigate(`/booking/${courtId}/data`);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Quản lý tài khoản"
      size="xl"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
        <Tabs.List>
          <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
            Thông tin
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Lịch sử
          </Tabs.Tab>
          <Tabs.Tab value="favorites" leftSection={<IconHeart size={16} />}>
            Yêu thích
          </Tabs.Tab>
        </Tabs.List>

        {/* Profile Tab */}
        <Tabs.Panel value="profile" pt="md">
          {loading ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : (
            <Stack gap="md">
              <Center>
                <Stack gap="sm" align="center">
                  <Avatar
                    src={avatarPreview || buildAvatarUrl(avatar || undefined)}
                    size={120}
                    radius="xl"
                  />
                  {editing && (
                    <Group gap="xs">
                      <FileButton
                        onChange={handleAvatarChange}
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                      >
                        {(props) => (
                          <Button
                            {...props}
                            variant="light"
                            size="xs"
                            leftSection={<IconPhoto size={16} />}
                          >
                            Chọn ảnh
                          </Button>
                        )}
                      </FileButton>
                      {(avatarPreview || avatar) && (
                        <Button
                          variant="light"
                          color="red"
                          size="xs"
                          leftSection={<IconTrash size={16} />}
                          onClick={handleRemoveAvatar}
                        >
                          Xóa ảnh
                        </Button>
                      )}
                    </Group>
                  )}
                </Stack>
              </Center>

              <TextInput
                label="Họ và tên"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.currentTarget.value)}
                disabled={!editing}
                required
              />

              <TextInput
                label="Email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                disabled
                readOnly
              />

              <TextInput
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                disabled={!editing}
              />

              <Group justify="flex-end" mt="md">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        // Reset avatar changes when cancel
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        loadUserProfile();
                      }}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleSaveProfile} loading={saving}>
                      Lưu
                    </Button>
                  </>
                ) : (
                  <Button leftSection={<IconEdit size={16} />} onClick={() => setEditing(true)}>
                    Chỉnh sửa
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </Tabs.Panel>

        {/* History Tab */}
        <Tabs.Panel value="history" pt="md">
          {loadingBookings ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : bookings.length === 0 ? (
            <Alert color="gray">Bạn chưa có lịch đặt nào.</Alert>
          ) : (
            <ScrollArea style={{ maxHeight: 500 }}>
              <Stack gap="md">
                {bookings.map((booking) => (
                  <Card key={booking._id} withBorder radius="md" padding="md">
                    <Group justify="space-between" align="flex-start" mb="sm">
                      <Stack gap={4} flex={1}>
                        <Text fw={600} size="lg">
                          {booking.courtGroupName || 'Sân thể thao'}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {booking.courtName || 'Sân'}
                        </Text>
                      </Stack>
                      <Badge color={getStatusColor(booking.status)} variant="light">
                        {getStatusText(booking.status)}
                      </Badge>
                    </Group>

                    <Divider my="sm" />

                    <Stack gap="xs">
                      <Group gap={6}>
                        <IconClock size={16} color="#40C057" />
                        <Text size="sm">
                          {booking.timeSlot?.startTime || booking.startTime || 'N/A'} -{' '}
                          {booking.timeSlot?.endTime || booking.endTime || 'N/A'}
                        </Text>
                      </Group>

                      <Group gap={6}>
                        <IconMapPin size={16} color="#FF6B6B" />
                        <Text size="sm" c="dimmed">
                          {booking.address || 'Chưa có địa chỉ'}
                        </Text>
                      </Group>

                      <Text size="sm" c="dimmed">
                        Ngày:{' '}
                        {booking.date || booking.booking_date
                          ? new Date(booking.date || booking.booking_date || '').toLocaleDateString(
                              'vi-VN',
                              {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )
                          : 'N/A'}
                      </Text>

                      {booking.price && (
                        <Text size="sm" fw={500}>
                          Giá: {Number(booking.price).toLocaleString('vi-VN')} đ
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Tabs.Panel>

        {/* Favorites Tab */}
        <Tabs.Panel value="favorites" pt="md">
          {loadingFavorites ? (
            <Group justify="center" py="xl">
              <Loader />
            </Group>
          ) : favorites.length === 0 ? (
            <Alert color="gray">Bạn chưa có sân yêu thích nào.</Alert>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {favorites.map((court) => {
                const coverImage = buildCourtImageUrl(court.images?.[0]);
                return (
                  <Card key={court._id} withBorder radius="md" padding="md">
                    <Card.Section>
                      <Image
                        src={coverImage}
                        height={150}
                        alt={court.name}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleCourtClick(court._id)}
                      />
                    </Card.Section>

                    <Stack gap="xs" mt="sm">
                      <Group justify="space-between" align="flex-start">
                        <Text fw={600} lineClamp={1} flex={1}>
                          {court.name}
                        </Text>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveFavorite(court._id)}
                        >
                          <IconX size={18} />
                        </ActionIcon>
                      </Group>

                      <Group gap={4}>
                        <IconStarFilled size={14} color="#F4C430" />
                        <Text size="sm" fw={500}>
                          {Number(court.rating || 0).toFixed(1)}
                        </Text>
                        <Badge color="green" variant="light" size="sm">
                          {court.type}
                        </Badge>
                      </Group>

                      <Group gap={6}>
                        <IconMapPin size={14} color="#FF6B6B" />
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {court.district}, {court.province}
                        </Text>
                      </Group>

                      <Button
                        size="xs"
                        variant="light"
                        fullWidth
                        onClick={() => handleCourtClick(court._id)}
                      >
                        Đặt lịch
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default UserProfileModal;
