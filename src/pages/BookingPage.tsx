import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getCourtGroupById,
} from '../services/courtService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Divider,
  Card,
  Badge,
  Grid,
  Box,
  ActionIcon,
  Anchor,
} from '@mantine/core';
import {
  IconMapPin,
  IconPhone,
  IconClock,
  IconStarFilled,
  IconCalendar,
} from '@tabler/icons-react';
import { CourtBookingTable } from '../components/CourtBookingTable';

const BookingPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [courtGroup, setCourtGroup] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Lấy nhóm sân theo id
  useEffect(() => {
    const fetchCourtGroup = async () => {
      if (groupId) {
        setLoading(true);
        try {
          const data = await getCourtGroupById(groupId);
          setCourtGroup(data);
        } catch (err) {
          console.error('Lỗi lấy sân lớn:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCourtGroup();
  }, [groupId]);

  // Ghép địa chỉ
  const fullAddress = courtGroup
    ? `${courtGroup.address}, ${courtGroup.district}, ${courtGroup.province}`
    : '';

  // Format số điện thoại
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format: 0xxx xxx xxxx
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  const phoneNumber = courtGroup?.phoneNumber || courtGroup?.phone || '';

  return (
    <>
      <Header />
      <Container size="xl" py="xl">
        {loading ? (
          <Text>Đang tải...</Text>
        ) : courtGroup ? (
          <Stack gap="xl">
            {/* Header Section - Thông tin sân */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" flex={1}>
                    <Title order={2}>{courtGroup.name}</Title>
                    <Group gap="xs">
                      <Badge color="green" variant="light" size="lg">
                        {courtGroup.type}
                      </Badge>
                      {courtGroup.rating && (
                        <Group gap={4}>
                          <IconStarFilled size={16} color="#F4C430" />
                          <Text size="sm" fw={600}>
                            {Number(courtGroup.rating || 0).toFixed(1)}
                          </Text>
                        </Group>
                      )}
                    </Group>
                  </Stack>
                </Group>

                <Divider />

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Group gap="xs">
                      <IconMapPin size={20} color="#FF6B6B" />
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed" fw={500}>
                          Địa chỉ
                        </Text>
                        <Text size="sm">
                          {courtGroup.address}, {courtGroup.district}, {courtGroup.province}
                        </Text>
                      </Stack>
                    </Group>
                  </Grid.Col>

                  {courtGroup.openTime && courtGroup.closeTime && (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Group gap="xs">
                        <IconClock size={20} color="#40C057" />
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed" fw={500}>
                            Giờ mở cửa
                          </Text>
                          <Text size="sm">
                            {courtGroup.openTime} - {courtGroup.closeTime}
                          </Text>
                        </Stack>
                      </Group>
                    </Grid.Col>
                  )}
                </Grid>

                {courtGroup.description && (
                  <>
                    <Divider />
                    <Text size="sm" c="dimmed">
                      {courtGroup.description}
                    </Text>
                  </>
                )}
              </Stack>
            </Paper>



            {/* Booking Table */}
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <IconCalendar size={24} color="#40C057" />
                  <Title order={4}>Đặt lịch sân</Title>
                </Group>
                <Divider />
                <CourtBookingTable courtGroup={courtGroup} />
              </Stack>
            </Paper>

            {/* Contact Section - Liên hệ đặt sân */}
            {phoneNumber && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <IconPhone size={24} color="#228BE6" />
                    <Title order={4}>Liên hệ đặt sân cố định</Title>
                  </Group>
                  <Divider />
                  <Group gap="md" align="center">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="xl"
                      radius="xl"
                      component="a"
                      href={`tel:${phoneNumber}`}
                    >
                      <IconPhone size={24} />
                    </ActionIcon>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={500}>
                        Gọi điện đặt sân trực tiếp
                      </Text>
                      <Anchor
                        href={`tel:${phoneNumber}`}
                        size="lg"
                        fw={600}
                        style={{ textDecoration: 'none' }}
                      >
                        {formatPhoneNumber(phoneNumber) || phoneNumber}
                      </Anchor>
                      <Text size="xs" c="dimmed">
                        Nhấn để gọi ngay
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              </Card>
            )}

            {/* Map Section */}
            {fullAddress && (
              <Paper shadow="sm" p="xl" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <IconMapPin size={24} color="#FF6B6B" />
                    <Title order={4}>Vị trí sân</Title>
                  </Group>
                  <Divider />
                  <Box
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #dee2e6',
                    }}
                  >
                    <iframe
                      title="Google Map"
                      width="100%"
                      height="450"
                      style={{ border: 0 }}
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        fullAddress
                      )}&output=embed`}
                      allowFullScreen
                    />
                  </Box>
                  <Text size="sm" c="dimmed" ta="center">
                    {fullAddress}
                  </Text>
                </Stack>
              </Paper>
            )}
          </Stack>
        ) : (
          <Text>Không tìm thấy thông tin sân</Text>
        )}
      </Container>
      <Footer />
    </>
  );
};

export default BookingPage;
