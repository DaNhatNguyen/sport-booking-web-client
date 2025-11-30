import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchCourtGroups, getReviews, createReview } from '../services/courtService';
import { CourtGroup } from '../types/courtGroup';
import { Review } from '../types/Review';
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
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconPhoto,
  IconMessage2,
  IconStarFilled,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import Header from '../components/Header';
import ImageSlider from '../components/ImageSlider';
import SearchBar from '../components/SearchBar';
import Footer from '../components/Footer';
import { checkLoginAndRedirect } from '../utils/auth';
import defaultCourtImage from '../assets/default-court-image.png';

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResults: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [courts, setCourts] = useState<CourtGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCourt, setSelectedCourt] = useState<CourtGroup | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const type = query.get('type') || '';
  const city = query.get('city') || '';
  const district = query.get('district') || '';

  const buildCourtImageUrl = (image?: string) => {
    if (!image) return defaultCourtImage;
    if (image.startsWith('http')) return image;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    return `${base}/files/court-images/${image}`;
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await searchCourtGroups(type, city, district);
        setCourts(data);
      } catch (error) {
        console.error('Lỗi khi tìm kiếm sân:', error);
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể tải kết quả tìm kiếm. Vui lòng thử lại.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [type, city, district]);

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

  const handleSelectCourt = (court: CourtGroup) => {
    setSelectedCourt(court);
    setActiveTab('info');
    setModalOpened(true);
  };

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

  return (
    <>
      <Header />
      <ImageSlider />
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <SearchBar />
      </div>

      <Container pt={200} pb={20}>
        <Stack gap="xs" mb="md">
          <Title order={3}>Kết quả tìm kiếm</Title>
          <Text c="dimmed">
            {type ? `Loại sân: ${type}` : 'Tất cả loại sân'} – {district}, {city}
          </Text>
        </Stack>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader color="green" />
          </Group>
        ) : courts.length === 0 ? (
          <Alert title="Không có sân phù hợp" color="gray">
            Không có sân nào phù hợp với khu vực đã chọn hoặc chưa có dữ liệu. Hãy thử tìm kiếm lại.
          </Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {courts.map((court) => {
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
                  <Card.Section>
                    <Image src={coverImage} height={170} alt={court.name} />
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
      </Container>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={selectedCourt?.name}
        size="lg"
        centered
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
                <Alert color="blue" title="Đang cập nhật">
                  Thông tin dịch vụ sẽ được cập nhật trong thời gian tới.
                </Alert>
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

      <Footer />
    </>
  );
};

export default SearchResults;
