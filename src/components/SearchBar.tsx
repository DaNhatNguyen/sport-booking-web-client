import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Select,
  Button,
  SimpleGrid,
  Group,
  Badge,
  Divider,
} from '@mantine/core';
import { IconBallTennis, IconMapPin, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

interface LocationData {
  name: string;
  districts: string[];
}

const SearchBar: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [districts, setDistricts] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('/locations.json')
      .then((res) => res.json())
      .then((data: LocationData[]) => setLocations(data));
  }, []);

  useEffect(() => {
    const found = locations.find((loc) => loc.name === selectedProvince);
    setDistricts(found ? found.districts : []);
    setSelectedDistrict('');
  }, [selectedProvince, locations]);

  const handleSearch = () => {
    if (!selectedSport || !selectedProvince || !selectedDistrict) {
      notifications.show({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn đầy đủ môn thể thao, tỉnh/thành và quận/huyện.',
        color: 'yellow',
      });
      return;
    }

    navigate(
      `/search-results?type=${selectedSport}&city=${selectedProvince}&district=${selectedDistrict}`
    );
  };

  return (
    <Paper
      shadow="xl"
      radius="lg"
      p={{ base: 'lg', md: 'xl' }}
      style={{
        position: 'absolute',
        top: -40,
        zIndex: 10,
        width: '100%',
        maxWidth: 1140,
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <div>
            <Title order={4}>Đặt sân thể thao ngay</Title>
            <Text size="sm" c="dimmed">
              Tìm kiếm sân chơi thể thao, thi đấu khắp cả nước
            </Text>
          </div>
          <Badge color="green" variant="light" leftSection={<IconBallTennis size={16} />}>
            Cập nhật liên tục
          </Badge>
        </Group>
        <Divider />
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <Select
            label="Loại sân"
            placeholder="Chọn sân thể thao"
            data={[
              { label: 'Sân cầu lông', value: 'Badminton' },
              { label: 'Sân bóng đá', value: 'Football' },
              { label: 'Sân tennis', value: 'Tennis' },
              { label: 'Sân bóng rổ', value: 'Basketball' },
            ]}
            value={selectedSport}
            onChange={(value) => setSelectedSport(value || '')}
            leftSection={<IconBallTennis size={16} />}
            withAsterisk
          />
          <Select
            label="Tỉnh/Thành phố"
            placeholder="Chọn tỉnh/thành phố"
            data={locations.map((loc) => ({ label: loc.name, value: loc.name }))}
            value={selectedProvince}
            onChange={(value) => setSelectedProvince(value || '')}
            searchable
            leftSection={<IconMapPin size={16} />}
            withAsterisk
          />
          <Select
            label="Quận/Huyện"
            placeholder="Chọn quận/huyện"
            data={districts.map((d) => ({ label: d, value: d }))}
            value={selectedDistrict}
            onChange={(value) => setSelectedDistrict(value || '')}
            disabled={!districts.length}
            searchable
            leftSection={<IconMapPin size={16} />}
            withAsterisk
          />
          <Button
            radius="md"
            size="lg"
            color="green"
            onClick={handleSearch}
            leftSection={<IconSearch size={18} />}
          >
            Tìm kiếm ngay
          </Button>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
};

export default SearchBar;
