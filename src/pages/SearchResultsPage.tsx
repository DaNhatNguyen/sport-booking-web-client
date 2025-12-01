import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchCourtGroups, getReviews, createReview, getCourtPrices } from '../services/courtService';
import { addFavorite, removeFavorite, checkFavorite } from '../services/favoriteService';
import { CourtGroup } from '../types/courtGroup';
import { Review } from '../types/Review';
import { CourtPrice } from '../types/CourtPrice';
import { getStoredUser } from '../services/authService';
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
  TextInput,
  Paper,
  Grid,
  NumberInput,
  Slider,
  Collapse,
  ActionIcon,
  Select,
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconInfoCircle,
  IconPhoto,
  IconMessage2,
  IconStarFilled,
  IconSearch,
  IconFilter,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconHeart,
  IconHeartFilled,
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
  const [courtPrices, setCourtPrices] = useState<CourtPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [favorites, setFavorites] = useState<Set<string | number>>(new Set());
  const [togglingFavorite, setTogglingFavorite] = useState<Set<string | number>>(new Set());

  // Search and filter states
  const [searchText, setSearchText] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [filtersOpened, setFiltersOpened] = useState<boolean>(false);

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
    if (type) setFilterType(type);
  }, [type]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Build search params
        const params = new URLSearchParams();
        if (searchText) params.append('search', searchText);
        if (filterType) params.append('type', filterType);
        if (city) params.append('city', city);
        if (district) params.append('district', district);
        if (minPrice) params.append('minPrice', minPrice.toString());
        if (maxPrice) params.append('maxPrice', maxPrice.toString());
        if (minRating > 0) params.append('minRating', minRating.toString());

        const data = await searchCourtGroups(type || filterType, city, district);
        
        // Client-side filtering for search text and rating
        let filtered = data;
        
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          filtered = filtered.filter(
            (court) =>
              court.name.toLowerCase().includes(searchLower) ||
              court.address?.toLowerCase().includes(searchLower) ||
              court.description?.toLowerCase().includes(searchLower)
          );
        }
        
        if (minRating > 0) {
          filtered = filtered.filter((court) => (court.rating || 0) >= minRating);
        }
        
        setCourts(filtered);

        // Load favorite status for all courts if user is logged in
        const user = getStoredUser();
        if (user && user.token) {
          try {
            const favoriteStatuses = await Promise.all(
              filtered.map(async (court) => {
                try {
                  const isFavorite = await checkFavorite(court._id);
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

            setFavorites(favoriteSet);
          } catch (err) {
            console.error('Error loading favorite statuses:', err);
            setFavorites(new Set());
          }
        } else {
          setFavorites(new Set());
        }
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
  }, [type, city, district, searchText, filterType, minPrice, maxPrice, minRating]);

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

  const clearFilters = () => {
    setSearchText('');
    setFilterType('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
  };

  const hasActiveFilters = searchText || filterType || minPrice || maxPrice || minRating > 0;

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
    <>
      <Header />
      <ImageSlider />
      <div
        style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <SearchBar />
      </div>

      <Container size="xl" pt={200} pb={20}>
        <Grid>
          {/* Sidebar Filters */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Paper shadow="sm" p="md" radius="md" withBorder style={{ position: 'sticky', top: 100 }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={5}>Bộ lọc</Title>
                  {hasActiveFilters && (
                    <ActionIcon variant="subtle" color="gray" onClick={clearFilters}>
                      <IconX size={16} />
                    </ActionIcon>
                  )}
                </Group>
                <Divider />

                {/* Text Search */}
                <TextInput
                  placeholder="Tìm kiếm tên sân, địa chỉ..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                  rightSection={
                    searchText && (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setSearchText('')}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    )
                  }
                />

                {/* Rating Filter */}
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Đánh giá tối thiểu
                  </Text>
                  <Slider
                    value={minRating}
                    onChange={setMinRating}
                    min={0}
                    max={5}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 2.5, label: '2.5' },
                      { value: 5, label: '5' },
                    ]}
                    mb="xs"
                  />
                  <Group justify="space-between" mt="xs">
                    <Text size="xs" c="dimmed" mt={20}>
                      Từ {minRating.toFixed(1)} sao trở lên
                    </Text>
                    <Group gap={4}>
                      <IconStarFilled size={14} color="#F4C430" />
                      <Text size="xs" fw={600}>
                        {minRating.toFixed(1)}
                      </Text>
                    </Group>
                  </Group>
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Results */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Title order={3}>Kết quả tìm kiếm</Title>
                  <Text c="dimmed">
                    {courts.length} {courts.length === 1 ? 'sân' : 'sân'} được tìm thấy
                    {type && ` • Loại: ${type}`}
                    {district && city && ` • ${district}, ${city}`}
                  </Text>
                </Stack>
                <Button
                  variant="light"
                  leftSection={filtersOpened ? <IconChevronUp size={16} /> : <IconFilter size={16} />}
                  onClick={() => setFiltersOpened(!filtersOpened)}
                  visibleFrom="md"
                  style={{ display: 'none' }}
                >
                  {filtersOpened ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                </Button>
              </Group>

              {loading ? (
                <Group justify="center" py="xl">
                  <Loader color="green" />
                </Group>
              ) : courts.length === 0 ? (
                <Alert title="Không có sân phù hợp" color="gray">
                  Không có sân nào phù hợp với tiêu chí tìm kiếm. Hãy thử điều chỉnh bộ lọc.
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

                          <Text fw={600} lineClamp={1}>
                            {court.name}
                          </Text>

                          <Group gap={6}>
                            <IconMapPin size={16} color="#FF6B6B" />
                            <Text size="sm" c="dimmed" lineClamp={1}>
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
            </Stack>
          </Grid.Col>
        </Grid>
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
                    <strong>Điện thoại:</strong> {(selectedCourt as any).phoneNumber || (selectedCourt as any).phone || 'Chưa cập nhật'}
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

      <Footer />
    </>
  );
};

export default SearchResults;
