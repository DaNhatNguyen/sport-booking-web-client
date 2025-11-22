import React, { useState, useEffect } from 'react';
import { Container, Card, Modal, Tabs, Tab, Button, Badge } from 'react-bootstrap';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { getCourtGroupsByLocation } from '../services/courtService';
import { CourtGroup } from '../types/courtGroup';
import { checkLoginAndRedirect } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import defaultCourtImage from '../assets/default-court-image.png';

const NearbyCourts: React.FC = () => {
  const [courtGroups, setCourtGroups] = useState<CourtGroup[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<CourtGroup | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  console.log('selectedCourt', selectedCourt?._id);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourtGroups = async () => {
      try {
        const location = JSON.parse(localStorage.getItem('selectedLocation') || '{}');
        const { province, district } = location;

        if (!province?.name || !district) {
          console.warn('Thiếu thông tin địa phương.');
          return;
        }

        const data = await getCourtGroupsByLocation(province.name, district);
        setCourtGroups(data);
      } catch (err) {
        console.error('Lỗi khi gọi API court group:', err);
      }
    };

    fetchCourtGroups();

    window.addEventListener('locationChanged', fetchCourtGroups);
    return () => window.removeEventListener('locationChanged', fetchCourtGroups);
  }, []);

  return (
    <Container className="my-5">
      <h4 className="fw-bold">Sân gần bạn</h4>
      <p className="text-muted">Khu vực được đề xuất gần vị trí của bạn</p>

      <div className="d-flex flex-wrap gap-4 justify-content-start">
        {courtGroups.length === 0 ? (
          <div className="text-muted fst-italic px-2">
            Không có sân nào phù hợp với khu vực đã chọn hoăc chưa có dữ liệu.
          </div>
        ) : (
          courtGroups.map((court) => (
            <div
              key={court._id}
              className="shadow-sm bg-white rounded"
              style={{
                flex: '1 1 calc(25% - 1rem)',
                minWidth: '260px',
                maxWidth: '300px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedCourt(court);
                setShowDetail(true);
              }}
            >
              <Card
                className="h-100"
                style={{
                  borderRadius: 10,
                }}
              >
                <Card.Img
                  variant="top"
                  src={court.images?.[0] || defaultCourtImage}
                  // src={'../assets/default-image.png'}
                  style={{ height: '160px', objectFit: 'cover', border: 'none' }}
                />
                <Card.Body>
                  <div className="text-muted small mb-1">
                    Mở cửa: {court.openTime} - {court.closeTime}
                  </div>
                  <div className="text-primary small">{court.type}</div>
                  <Card.Title className="mb-1">{court.name}</Card.Title>
                  <div className="text-muted small">
                    <FaMapMarkerAlt className="text-danger me-1" />
                    {court.address}, {court.district}, {court.province}
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Modal chi tiết sân */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourt?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="info" id="court-detail-tabs" className="mb-3 border-bottom">
            <Tab eventKey="info" title="Thông tin">
              <div className="tab-scroll">
                <img
                  // src={selectedCourt?.images?.[0] || defaultCourtImage}
                  src={defaultCourtImage}
                  alt="court"
                  className="img-fluid rounded mb-3"
                  style={{}}
                />
                <p>
                  <strong>Loại sân:</strong> {selectedCourt?.type}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {selectedCourt?.address}, {selectedCourt?.district},{' '}
                  {selectedCourt?.province}
                </p>
                <p>
                  <strong>Thời gian mở cửa:</strong> {selectedCourt?.openTime} -{' '}
                  {selectedCourt?.closeTime}
                </p>
                <p>
                  <strong>Điện thoại:</strong> {selectedCourt?.phoneNumber || 'Chưa có'}
                </p>
                <p>
                  <strong>Đánh giá:</strong> <FaStar color="#ffc960" /> {selectedCourt?.rating}
                </p>
              </div>
            </Tab>
            <Tab eventKey="services" title="Dịch vụ">
              <p>Dịch Vụ</p>
            </Tab>
            <Tab eventKey="images" title="Hình ảnh">
              <div className="d-flex flex-wrap gap-2 mt-2">
                {selectedCourt?.images?.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`court-img-${idx}`}
                    style={{
                      width: '150px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                ))}
              </div>
            </Tab>
            <Tab eventKey="reviews" title="Đánh giá">
              <p>Đánh giá</p>
            </Tab>
          </Tabs>

          <div className="text-end">
            <Button
              variant="warning"
              style={{ color: '#ffff' }}
              onClick={() =>
                checkLoginAndRedirect(navigate, () => {
                  if (selectedCourt?._id) {
                    navigate(`/booking/${selectedCourt?._id}/data`);
                  } else {
                    toast.error('Không tìm thấy sân để đặt lịch.');
                  }
                })
              }
            >
              Đặt lịch
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default NearbyCourts;
