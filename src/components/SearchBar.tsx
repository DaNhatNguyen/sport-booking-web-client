import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CustomButton from './CustomButton';

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSport || !selectedProvince || !selectedDistrict) {
      alert('Vui lòng chọn đầy đủ thông tin để tìm kiếm!');
      return;
    }

    try {
      navigate(`/search-results?type=${selectedSport}&city=${selectedProvince}&district=${selectedDistrict}`);
    } catch (err) {
      console.error('Lỗi khi chuyển hướng tìm kiếm:', err);
    }
  };

  return (
    <div className="bg-white py-4" style={{
      position: 'absolute',
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      width: '100%',
      maxWidth: '1140px'
    }}>
      <Container className="shadow rounded px-4 py-3 bg-white">
        <h5 className="fw-bold mb-1">Đặt sân thể thao ngay</h5>
        <p className="text-muted mb-4">Tìm kiếm sân chơi thể thao, thi đấu khắp cả nước</p>

        <Form onSubmit={handleSearch}>
          <Row className="g-2 align-items-center">
            <Col md={3} sm={6}>
              <Form.Select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="">Chọn sân thể thao</option>
                <option value="Sân cầu lông">Sân Cầu lông</option>
                <option value="Sân bóng đá">Sân bóng đá</option>
                <option value="Sân tennis">Sân tennis</option>
                <option value="Sân bóng bàn">Sân bóng bàn</option>
              </Form.Select>
            </Col>

            <Col md={3} sm={6}>
              <Form.Select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {locations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={3} sm={6}>
              <Form.Select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!districts.length}
              >
                <option value="">Chọn quận/huyện</option>
                {districts.map((d, idx) => (
                  <option key={idx} value={d}>{d}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={3} sm={6}>
              <CustomButton type="submit" variant="danger" className="w-100">
                Tìm kiếm ngay
              </CustomButton>
            </Col>
          </Row>
        </Form>
      </Container>
    </div>
  );
};

export default SearchBar;
