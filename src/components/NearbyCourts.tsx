import React, { useState, useEffect } from 'react';
import { Container, Card, Modal, Tabs, Tab, Button, Badge, Form, Alert } from 'react-bootstrap';
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { getCourtGroupsByLocation, getReviews, createReview } from '../services/courtService';
import { CourtGroup } from '../types/courtGroup';
import { checkLoginAndRedirect } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Review } from '../types/Review';

const NearbyCourts: React.FC = () => {
  const [courtGroups, setCourtGroups] = useState<CourtGroup[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<CourtGroup | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<string>('info');

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedCourt?._id) return;
      try {
        const data = await getReviews(selectedCourt._id);
        setReviews(data);
      } catch (err) {
        console.error('Lỗi khi tải đánh giá sân:', err);
      }
    };

    if (showDetail && selectedCourt) {
      fetchReviews();
    }
  }, [showDetail, selectedCourt]);

  const handleOpenReview = () => {
    checkLoginAndRedirect(navigate, async () => {
      setActiveTab('reviews');
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt?._id) return;

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      await createReview({
        courtGroupId: selectedCourt._id,
        rating,
        comment,
      });
      setReviewSuccess('Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận.');
      setComment('');

      const data = await getReviews(selectedCourt._id);
      setReviews(data);
    } catch (err: any) {
      console.error('Lỗi gửi đánh giá:', err);
      setReviewError(
        err?.response?.data?.message ||
          'Không thể gửi đánh giá. Hãy chắc chắn bạn đã từng đặt sân này.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <Container className="my-5">
      <h4 className="fw-bold">Sân gần bạn</h4>
      <p className="text-muted">Khu vực được đề xuất gần vị trí của bạn</p>

      <div className="d-flex gap-2 flex-wrap mb-4">
        <Badge pill bg="dark" text="light">
          Tất cả
        </Badge>
      </div>

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
              <Card className="h-100 border-0">
                <Card.Img
                  variant="top"
                  src={court.images?.[0] || '/default-image.png'}
                  // src={'../assets/default-image.png'}
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

      {/* Modal chi tiết sân */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourt?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            id="court-detail-tabs"
            className="mb-3 border-bottom"
          >
            <Tab eventKey="info" title="Thông tin">
              <div className="tab-scroll">
                <img
                  src={selectedCourt?.images?.[0] || '/default-image.png'}
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
                  <strong>Đánh giá:</strong> <FaStar color="#ffc960" /> {selectedCourt?.rating || 0}
                </p>
                <Button variant="outline-warning" size="sm" onClick={handleOpenReview}>
                  Viết đánh giá
                </Button>
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
              <div className="mt-2">
                <h6 className="fw-bold">Viết đánh giá của bạn</h6>
                <Form onSubmit={handleSubmitReview} className="mb-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Điểm (1–5)</Form.Label>
                    <Form.Select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      disabled={submittingReview}
                    >
                      {[1, 2, 3, 4, 5].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Nhận xét</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sân..."
                      disabled={submittingReview}
                    />
                  </Form.Group>
                  {reviewError && <Alert variant="danger">{reviewError}</Alert>}
                  {reviewSuccess && <Alert variant="success">{reviewSuccess}</Alert>}
                  <Button type="submit" variant="warning" disabled={submittingReview}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Button>
                </Form>

                <h6 className="fw-bold mt-3">Các đánh giá khác</h6>
                {reviews.length === 0 ? (
                  <p className="text-muted fst-italic mt-1">
                    Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên đánh giá sau khi đặt
                    sân!
                  </p>
                ) : (
                  <div className="mt-1">
                    {reviews.map((r) => (
                      <div key={r.id} className="mb-3 border-bottom pb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong>{r.userName || 'Người dùng'}</strong>
                          <span>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <FaStar
                                key={i}
                                color={i <= r.rating ? '#ffc960' : '#e0e0e0'}
                                style={{ marginRight: 2 }}
                              />
                            ))}
                          </span>
                        </div>
                        {r.comment && <p className="mb-1">{r.comment}</p>}
                        {r.createdAt && (
                          <small className="text-muted">
                            {new Date(r.createdAt).toLocaleString('vi-VN')}
                          </small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
