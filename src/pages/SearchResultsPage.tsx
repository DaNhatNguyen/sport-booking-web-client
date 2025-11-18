import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchCourtGroups } from '../services/courtService';
import { CourtGroup } from '../types/courtGroup';
import { Container, Card, Modal, Tabs, Tab, Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import Header from '../components/Header';
import ImageSlider from '../components/ImageSlider';
import SearchBar from '../components/SearchBar';
import Footer from '../components/Footer';
import { checkLoginAndRedirect } from '../utils/auth';
import { toast } from 'react-toastify';

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResults: React.FC = () => {
  const query = useQuery();
  const [courts, setCourts] = useState<CourtGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCourt, setSelectedCourt] = useState<CourtGroup | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const type = query.get('type') || '';
  const city = query.get('city') || '';
  const district = query.get('district') || '';

  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await searchCourtGroups(type, city, district);
        setCourts(data);
      } catch (error) {
        console.error('Lỗi khi tìm kiếm sân:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [type, city, district]);

  return (
    <>
      <Header />
      <ImageSlider />
      <div style={{ position: 'relative' }}>
        <SearchBar />
      </div>
      <div className='mtopCourt'>
        <Container className="my-5">
          <h4 className="fw-bold mb-3">Kết quả tìm kiếm</h4>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <div className="d-flex flex-wrap gap-4 justify-content-start">
              {courts.length === 0 ? (
                <div className="text-muted fst-italic px-2">
                  Không có sân nào phù hợp với khu vực đã chọn hoặc chưa có dữ liệu.
                </div>
              ) : (
                courts.map((court) => (
                  <div
                    key={court._id}
                    className="shadow-sm bg-white rounded"
                    style={{
                      flex: '1 1 calc(25% - 1rem)',
                      minWidth: '260px',
                      maxWidth: '300px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedCourt(court);
                      setShowDetail(true);
                    }}
                  >
                    <Card className="h-100 border-0">
                      <Card.Img
                        variant="top"
                        src={court.images?.[0] || '/default-image.png'}
                        style={{ height: '160px', objectFit: 'cover' }}
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
          )}

          <Modal
            show={showDetail}
            onHide={() => setShowDetail(false)}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>{selectedCourt?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Tabs defaultActiveKey="info" id="court-detail-tabs" className="mb-3 border-bottom">
                <Tab eventKey="info" title="Thông tin">
                  <div className="tab-scroll">
                    <img
                      src={selectedCourt?.images?.[0] || '/default-image.jpg'}
                      alt="court"
                      className="img-fluid rounded mb-3"
                    />
                    <p><strong>Loại sân:</strong> {selectedCourt?.type}</p>
                    <p><strong>Địa chỉ:</strong> {selectedCourt?.address}, {selectedCourt?.district}, {selectedCourt?.province}</p>
                    <p><strong>Thời gian mở cửa:</strong> {selectedCourt?.openTime} - {selectedCourt?.closeTime}</p>
                    <p><strong>Điện thoại:</strong> {selectedCourt?.phoneNumber || 'Chưa có'}</p>
                    <p><strong>Đánh giá:</strong> <FaStar color='#ffc960' /> {selectedCourt?.rating}</p>
                  </div>
                </Tab>
                <Tab eventKey="services" title="Dịch vụ">
                  <p>Thông tin dịch vụ đi kèm của sân...</p>
                </Tab>
                <Tab eventKey="images" title="Hình ảnh">
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {selectedCourt?.images?.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`court-img-${idx}`}
                        style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    ))}
                  </div>
                </Tab>
                <Tab eventKey="reviews" title="Đánh giá">
                  <p>Hiển thị đánh giá từ người dùng...</p>
                </Tab>
              </Tabs>

              <div className="text-end">
                <Button
                  variant="warning"
                  style={{ color: "#ffff" }}
                  onClick={() =>
                    checkLoginAndRedirect(navigate, () => {
                      if (selectedCourt?._id) {
                        navigate(`/booking/${selectedCourt._id}`);
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
      </div>
      <Footer />
    </>
  );
};

export default SearchResults;
