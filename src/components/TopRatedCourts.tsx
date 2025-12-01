import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Image,
  Text,
  Group,
  Stack,
  Badge,
  SimpleGrid,
  Modal,
  Tabs,
  Button,
  Box,
  Divider,
  ScrollArea,
  Alert,
  Rating,
  Textarea,
  Title,
  Loader,
  ActionIcon,
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconPhoto,
  IconMessage2,
  IconStarFilled,
  IconTrophy,
  IconHeart,
  IconHeartFilled,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import {
  getTopRatedCourts,
  getReviews,
  createReview,
  getCourtPrices,
} from '../services/courtService';
import { addFavorite, removeFavorite, checkFavorite } from '../services/favoriteService';
import { CourtGroup } from '../types/courtGroup';
import { Review } from '../types/Review';
import { CourtPrice } from '../types/CourtPrice';
import { checkLoginAndRedirect } from '../utils/auth';
import { getStoredUser } from '../services/authService';
import defaultCourtImage from '../assets/default-court-image.png';

const TopRatedCourts: React.FC = () => {
  const [courtGroups, setCourtGroups] = useState<CourtGroup[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<CourtGroup | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [courtPrices, setCourtPrices] = useState<CourtPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState<Set<string | number>>(new Set());

  const navigate = useNavigate();

  const buildCourtImageUrl = (image?: string) => {
    if (!image) return defaultCourtImage;
    if (image.startsWith('http')) return image;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${base}/files/court-images/${image}`;
  };

  useEffect(() => {
    const fetchTopRatedCourts = async () => {
      try {
        setLoadingCourts(true);
        const data = await getTopRatedCourts();
        setCourtGroups(data);

        // Load favorite status for all courts if user is logged in
        const user = getStoredUser();
        if (user && user.token) {
          try {
            const favoriteStatuses = await Promise.all(
              data.map(async (court) => {
                try {
                  const isFavorite = await checkFavorite(court._id);
                  // Log để debug (có thể xóa sau)
                  console.log(`Court ${court._id}: isFavorite =`, isFavorite, typeof isFavorite);
                  return { courtId: court._id, isFavorite: isFavorite === true };
                } catch (err) {
                  console.error(`Error checking favorite for court ${court._id}:`, err);
                  return { courtId: court._id, isFavorite: false };
                }
              })
            );

            // Chỉ thêm vào set nếu isFavorite thực sự là true
            const favoriteSet = new Set<string | number>();
            favoriteStatuses.forEach((f) => {
              if (f.isFavorite === true) {
                favoriteSet.add(f.courtId);
              }
            });

            console.log('Loaded favorites:', Array.from(favoriteSet));
            setFavorites(favoriteSet);
          } catch (err) {
            console.error('Error loading favorite statuses:', err);
            // Nếu có lỗi, set empty set để không hiển thị sai
            setFavorites(new Set());
          }
        } else {
          // Nếu chưa đăng nhập, đảm bảo set empty
          setFavorites(new Set());
        }
      } catch (err) {
        console.error('Lỗi khi gọi API top rated courts:', err);
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể tải danh sách sân. Vui lòng thử lại.',
          color: 'red',
        });
      } finally {
        setLoadingCourts(false);
      }
    };

    fetchTopRatedCourts();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedCourt?._id) return;
      try {
        setLoadingReviews(true);
        const data = await getReviews(selectedCourt._id);
        setReviews(data);
      } catch (err) {
        console.error('Lỗi khi tải đánh giá sân:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (modalOpened && selectedCourt) {
      fetchReviews();
    }
  }, [modalOpened, selectedCourt]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (!selectedCourt?._id) return;
      try {
        setLoadingPrices(true);
        const data = await getCourtPrices(selectedCourt._id);
        setCourtPrices(data);
      } catch (err) {
        console.error('Lỗi khi tải giá sân:', err);
        setCourtPrices([]);
      } finally {
        setLoadingPrices(false);
      }
    };

    if (modalOpened && selectedCourt && activeTab === 'services') {
      fetchPrices();
    }
  }, [modalOpened, selectedCourt, activeTab]);

  const handleOpenReview = () => {
    checkLoginAndRedirect(navigate, () => {
      setActiveTab('reviews');
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt?._id) return;

    setSubmittingReview(true);

    try {
      await createReview({
        courtGroupId: selectedCourt._id,
        rating,
        comment,
      });

      notifications.show({
        title: 'Cảm ơn bạn!',
        message: 'Đánh giá của bạn đã được ghi nhận.',
        color: 'green',
      });

      setComment('');
      const data = await getReviews(selectedCourt._id);
      setReviews(data);
    } catch (err: any) {
      notifications.show({
        title: 'Lỗi',
        message:
          err?.response?.data?.message ||
          'Không thể gửi đánh giá. Hãy chắc chắn bạn đã từng đặt sân này.',
        color: 'red',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSelectCourt = (court: CourtGroup) => {
    setSelectedCourt(court);
    setActiveTab('info');
    setModalOpened(true);
  };

  const handleBooking = () => {
    checkLoginAndRedirect(navigate, () => {
      if (selectedCourt?._id) {
        navigate(`/booking/${selectedCourt._id}/data`);
      } else {
        notifications.show({
          title: 'Lỗi',
          message: 'Không tìm thấy sân để đặt lịch.',
          color: 'red',
        });
      }
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent, courtId: string | number) => {
    e.stopPropagation(); // Prevent card click

    const user = getStoredUser();
    if (!user || !user.token) {
      checkLoginAndRedirect(navigate, () => {});
      return;
    }

    const isFavorite = favorites.has(courtId);
    setTogglingFavorite((prev) => new Set(prev).add(courtId));

    try {
      if (isFavorite) {
        await removeFavorite(courtId);
        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(courtId);
          return newSet;
        });
        notifications.show({
          title: 'Đã xóa',
          message: 'Đã xóa khỏi danh sách yêu thích',
          color: 'gray',
        });
      } else {
        await addFavorite(courtId);
        // Thêm vào state ngay lập tức (optimistic update)
        setFavorites((prev) => new Set(prev).add(courtId));
        notifications.show({
          title: 'Đã thêm',
          message: 'Đã thêm vào danh sách yêu thích',
          color: 'pink',
        });

        // Verify lại sau 500ms để đảm bảo sync với DB (không block UI)
        setTimeout(async () => {
          try {
            const verified = await checkFavorite(courtId);
            if (!verified) {
              // Nếu verify fail, xóa khỏi state
              setFavorites((prev) => {
                const newSet = new Set(prev);
                newSet.delete(courtId);
                return newSet;
              });
              notifications.show({
                title: 'Lỗi',
                message: 'Không thể xác nhận yêu thích',
                color: 'red',
              });
            }
          } catch (err) {
            // Ignore verification error
          }
        }, 500);
      }
    } catch (err: any) {
      // Nếu có lỗi, reload lại favorite status để đảm bảo sync với DB
      if (user && user.token) {
        try {
          const verified = await checkFavorite(courtId);
          setFavorites((prev) => {
            const newSet = new Set(prev);
            if (verified) {
              newSet.add(courtId);
            } else {
              newSet.delete(courtId);
            }
            return newSet;
          });
        } catch {
          // Ignore verification error
        }
      }

      notifications.show({
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Không thể cập nhật yêu thích',
        color: 'red',
      });
    } finally {
      setTogglingFavorite((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courtId);
        return newSet;
      });
    }
  };

  return (
    <Container size="xl" pb={20}>
      <Stack gap="xs" mb="md">
        <Group gap="xs">
          <Title order={3}>Sân được đề xuất</Title>
        </Group>
        <Text c="dimmed">Khám phá những sân thể thao được người dùng đánh giá tốt nhất</Text>
      </Stack>

      {loadingCourts ? (
        <Group justify="center" py="xl">
          <Loader color="green" />
        </Group>
      ) : courtGroups.length === 0 ? (
        <Alert title="Không có dữ liệu" color="gray">
          Hiện tại chưa có sân nào được đánh giá.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {courtGroups.map((court) => {
            const coverImage = buildCourtImageUrl(court.images?.[0]);
            return (
              <Card
                key={court._id}
                withBorder
                radius="md"
                padding="md"
                shadow="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelectCourt(court)}
              >
                <Card.Section style={{ position: 'relative' }}>
                  <Image src={coverImage} height={170} alt={court.name} />
                  <ActionIcon
                    variant="filled"
                    color={favorites.has(court._id) ? 'red' : 'gray'}
                    size="lg"
                    radius="xl"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                    }}
                    loading={togglingFavorite.has(court._id)}
                    onClick={(e) => handleToggleFavorite(e, court._id)}
                  >
                    {favorites.has(court._id) ? (
                      <IconHeartFilled size={20} />
                    ) : (
                      <IconHeart size={20} />
                    )}
                  </ActionIcon>
                </Card.Section>

                <Stack gap="xs" mt="sm">
                  <Group justify="space-between" align="flex-start">
                    <Badge color="green" variant="light">
                      {court.type}
                    </Badge>
                    <Group gap={4}>
                      <IconStarFilled size={16} color="#F4C430" />
                      <Text size="sm" fw={600}>
                        {Number(court.rating || 0).toFixed(1)}
                      </Text>
                    </Group>
                  </Group>

                  <Text fw={600}>{court.name}</Text>

                  <Group gap={6}>
                    <IconMapPin size={16} color="#FF6B6B" />
                    <Text size="sm" c="dimmed">
                      {court.address}, {court.district}, {court.province}
                    </Text>
                  </Group>

                  <Group gap={6}>
                    <IconClock size={16} color="#40C057" />
                    <Text size="sm" c="dimmed">
                      {court.openTime} – {court.closeTime}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedCourt?.name}
        size="lg"
      >
        {selectedCourt && (
          <Stack gap="md">
            <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
              <Tabs.List>
                <Tabs.Tab value="info" leftSection={<IconInfoCircle size={16} />}>
                  Thông tin
                </Tabs.Tab>
                <Tabs.Tab value="services">Dịch vụ</Tabs.Tab>
                <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
                  Hình ảnh
                </Tabs.Tab>
                <Tabs.Tab value="reviews" leftSection={<IconMessage2 size={16} />}>
                  Đánh giá
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="info" pt="md">
                <Stack gap="sm">
                  <Image
                    src={buildCourtImageUrl(selectedCourt.images?.[0])}
                    radius="md"
                    alt={selectedCourt.name}
                  />
                  <Group gap="xs">
                    <Badge color="teal" variant="light">
                      {selectedCourt.type}
                    </Badge>
                  </Group>
                  <Text>
                    <strong>Địa chỉ:</strong> {selectedCourt.address}, {selectedCourt.district},{' '}
                    {selectedCourt.province}
                  </Text>
                  <Text>
                    <strong>Giờ mở cửa:</strong> {selectedCourt.openTime} –{' '}
                    {selectedCourt.closeTime}
                  </Text>
                  <Text>
                    <strong>Điện thoại:</strong> {selectedCourt.phoneNumber || 'Chưa cập nhật'}
                  </Text>
                  <Group>
                    <Button variant="outline" color="yellow" onClick={handleOpenReview}>
                      Viết đánh giá
                    </Button>
                    <Button color="green" onClick={handleBooking}>
                      Đặt lịch
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="services" pt="md">
                {loadingPrices ? (
                  <Group justify="center" py="lg">
                    <Loader size="sm" />
                  </Group>
                ) : courtPrices.length === 0 ? (
                  <Alert color="gray">Sân chưa có thông tin giá và khung giờ.</Alert>
                ) : (
                  <Stack gap="md">
                    <Text fw={600} size="lg">
                      Bảng giá theo khung giờ
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      {['WEEKDAY', 'WEEKEND'].map((dayType) => {
                        const pricesForDay = courtPrices.filter((p) => p.dayType === dayType);
                        if (pricesForDay.length === 0) return null;

                        return (
                          <Card key={dayType} withBorder radius="md" padding="md">
                            <Text fw={600} mb="sm" c={dayType === 'WEEKEND' ? 'red' : 'blue'}>
                              {dayType === 'WEEKDAY' ? 'Ngày thường' : 'Cuối tuần'}
                            </Text>
                            <Stack gap="xs">
                              {pricesForDay.map((price) => (
                                <Group
                                  key={price.id}
                                  justify="space-between"
                                  p="xs"
                                  style={{ backgroundColor: '#f8f9fa', borderRadius: 4 }}
                                >
                                  <Text size="sm">
                                    {price.startTime} - {price.endTime}
                                  </Text>
                                  <Text size="sm" fw={600} c="green">
                                    {Number(price.price).toLocaleString('vi-VN')} đ
                                  </Text>
                                </Group>
                              ))}
                            </Stack>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="images" pt="md">
                {selectedCourt.images && selectedCourt.images.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                    {selectedCourt.images.map((img, idx) => (
                      <Image key={idx} src={buildCourtImageUrl(img)} height={120} radius="md" />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Alert color="gray">Sân chưa cập nhật hình ảnh.</Alert>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="reviews" pt="md">
                <Stack gap="md">
                  <Box component="form" onSubmit={handleSubmitReview}>
                    <Stack gap="sm">
                      <Text fw={600}>Chia sẻ đánh giá của bạn</Text>
                      <Group gap="xs">
                        <Text size="sm">Điểm:</Text>
                        <Rating value={rating} onChange={setRating} fractions={1} size="lg" />
                      </Group>
                      <Textarea
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        minRows={3}
                        value={comment}
                        onChange={(event) => setComment(event.currentTarget.value)}
                        disabled={submittingReview}
                      />
                      <Group justify="flex-end">
                        <Button type="submit" loading={submittingReview}>
                          {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </Button>
                      </Group>
                    </Stack>
                  </Box>

                  <Divider />

                  {loadingReviews ? (
                    <Group justify="center" py="lg">
                      <Loader size="sm" />
                    </Group>
                  ) : reviews.length === 0 ? (
                    <Alert color="gray">
                      Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên chia sẻ trải nghiệm!
                    </Alert>
                  ) : (
                    <ScrollArea style={{ maxHeight: 300 }}>
                      <Stack gap="sm">
                        {reviews.map((review) => (
                          <Card key={review.id} withBorder radius="md">
                            <Group justify="space-between" align="flex-start">
                              <Stack gap={4} flex={1}>
                                <Text fw={600}>{review.userName || 'Người dùng'}</Text>
                                <Rating value={review.rating} readOnly size="sm" />
                              </Stack>
                              {review.createdAt && (
                                <Text size="xs" c="dimmed">
                                  {new Date(review.createdAt).toLocaleString('vi-VN')}
                                </Text>
                              )}
                            </Group>
                            {review.comment && (
                              <Text size="sm" mt="sm">
                                {review.comment}
                              </Text>
                            )}
                          </Card>
                        ))}
                      </Stack>
                    </ScrollArea>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default TopRatedCourts;
