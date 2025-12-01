import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Stack,
  Group,
  Text,
  Title,
  Anchor,
  Divider,
  Box,
  Image,
} from '@mantine/core';
import {
  IconPhone,
  IconMail,
  IconMapPin,
  IconHome,
  IconBuildingStore,
  IconNews,
} from '@tabler/icons-react';
import logo from '../assets/logo.png';
import boCongThuong from '../assets/bocongthuong.png';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      style={{
        backgroundColor: '#0e5089',
        color: '#fff',
        marginTop: 'auto',
      }}
    >
      <Container size="xl" py="xl">
        <Grid>
          {/* Company Info */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Image src={logo} alt="Nport" height={40} fit="contain" style={{ maxWidth: 150 }} />
              <Stack gap="xs">
                <Group gap="xs">
                  <IconMapPin size={18} color="#fff" />
                  <Text size="sm" c="gray.2">
                    879 Giải Phóng, Hoàng Mai, Hà Nội
                  </Text>
                </Group>
                <Group gap="xs">
                  <IconPhone size={18} color="#fff" />
                  <Anchor
                    href="tel:0985456789"
                    c="gray.2"
                    size="sm"
                    style={{ textDecoration: 'none' }}
                  >
                    0985456789
                  </Anchor>
                </Group>
                <Group gap="xs">
                  <IconMail size={18} color="#fff" />
                  <Anchor
                    href="mailto:nguyendanhat@gmail.com"
                    c="gray.2"
                    size="sm"
                    style={{ textDecoration: 'none' }}
                  >
                    nguyendanhat@gmail.com
                  </Anchor>
                </Group>
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Policies */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Title order={6} c="white" fw={600}>
                Quy định và chính sách
              </Title>
              <Stack gap="xs">
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  Hướng dẫn sử dụng
                </Anchor>
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  Quy chế hoạt động ứng dụng
                </Anchor>
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  Thông tin về thanh toán
                </Anchor>
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  Chính sách bảo mật thông tin cá nhân
                </Anchor>
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  Thông tin chăm sóc khách hàng
                </Anchor>
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Quick Links */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Title order={6} c="white" fw={600}>
                Liên kết nhanh
              </Title>
              <Stack gap="xs">
                <Anchor
                  component={Link}
                  to="/"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  <Group gap="xs">
                    <IconHome size={16} />
                    <Text>Trang chủ</Text>
                  </Group>
                </Anchor>
                <Anchor
                  component={Link}
                  to="/collaboration"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  <Group gap="xs">
                    <IconBuildingStore size={16} />
                    <Text>Dành cho đối tác</Text>
                  </Group>
                </Anchor>
                <Anchor
                  component={Link}
                  to="#"
                  c="gray.2"
                  size="sm"
                  style={{
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  <Group gap="xs">
                    <IconNews size={16} />
                    <Text>Tin tức</Text>
                  </Group>
                </Anchor>
              </Stack>
              <Box mt="md">
                <Image
                  src={boCongThuong}
                  alt="Bộ Công Thương"
                  height={40}
                  fit="contain"
                  style={{ maxWidth: 120 }}
                />
              </Box>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      <Divider color="rgba(255, 255, 255, 0.1)" />

      {/* Footer Bottom */}
      <Container size="xl" py="md">
        <Text size="sm" ta="center" c="gray.2">
          Copyright © 2025 – <Text span c="red" fw={600} inherit>Nport</Text>. All rights reserved.
          <br />
          Designed by <Text span c="red" fw={600} inherit>DaNhatNguyen</Text>
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;
