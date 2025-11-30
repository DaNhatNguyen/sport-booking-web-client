# Hướng dẫn API Backend cho chức năng Thanh toán

## 1. API: Lấy thông tin thanh toán

**Endpoint:** `GET /api/bookings/{booking_id}/payment-info`

**Mục đích:** Lấy thông tin thanh toán bao gồm thông tin ngân hàng của chủ sân

**Request:**

- Path parameter: `booking_id` (number)
- Headers: `Authorization: Bearer {token}`

**Response:**

```json
{
  "result": {
    "booking_id": 43,
    "owner_bank_name": "MB BANK",
    "owner_bank_account_number": "2136668885959",
    "owner_bank_account_name": "NGUYEN DA NHAT",
    "owner_bank_qr_image": "bankqr.png",
    "total_price": 200000,
    "booking_date": "2025-11-23",
    "time_slots": [{ "start_time": "18:00", "end_time": "19:00" }],
    "court_name": "Sân 4",
    "full_address": "18 Tam Trinh",
    "created_at": "2025-11-23T15:52:39"
  }
}
```

**⚠️ Lưu ý:** Phải trả về `created_at` để frontend tính chính xác thời gian còn lại (trường hợp user thoát rồi quay lại trang).

**Logic backend:**

1. Lấy thông tin booking từ bảng `bookings` theo `booking_id`
2. JOIN với bảng `courts` để lấy `court_group_id`
3. JOIN với bảng `court_groups` để lấy `owner_id` và `address`
4. JOIN với bảng `users` (role = OWNER) để lấy thông tin ngân hàng:
   - `bank_name`
   - `bank_account_number`
   - `bank_account_name`
   - `bank_qr_image`

**SQL mẫu:**

```sql
SELECT
  b.id as booking_id,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.price as total_price,
  b.created_at,
  c.name as court_name,
  cg.address as full_address,
  u.bank_name as owner_bank_name,
  u.bank_account_number as owner_bank_account_number,
  u.bank_account_name as owner_bank_account_name,
  u.bank_qr_image as owner_bank_qr_image
FROM bookings b
JOIN courts c ON b.court_id = c.id
JOIN court_groups cg ON c.court_group_id = cg.id
JOIN users u ON cg.owner_id = u.id
WHERE b.id = ? AND b.status = 'PAYING'
```

---

## 2. API: Xác nhận thanh toán

**Endpoint:** `POST /api/bookings/{booking_id}/confirm-payment`

**Mục đích:** Upload ảnh chuyển khoản và cập nhật status booking thành PENDING

**Request:**

- Path parameter: `booking_id` (number)
- Headers:
  - `Authorization: Bearer {token}`
  - `Content-Type: multipart/form-data`
- Body (FormData):
  - `payment_proof`: File (ảnh chuyển khoản)
  - `booking_id`: number

**Response:**

```json
{
  "result": {
    "booking_id": 43,
    "status": "PENDING",
    "payment_proof_url": "uploads/payment_proof_43_1732348759.jpg",
    "message": "Đã xác nhận thanh toán. Chúng tôi sẽ xác minh trong thời gian sớm nhất."
  }
}
```

**Logic backend:**

1. Kiểm tra booking tồn tại và status = 'PAYING'
2. Upload file ảnh lên server (thư mục `uploads/`)
3. Đổi tên file: `payment_proof_{booking_id}_{timestamp}.{ext}`
4. Update bảng `bookings`:
   - `status` = 'PENDING'
   - Thêm cột mới (nếu chưa có): `payment_proof` VARCHAR(255) - lưu tên file ảnh
5. Return kết quả

**Java/Spring Boot mẫu:**

```java
@PostMapping("/{bookingId}/confirm-payment")
public ResponseEntity<?> confirmPayment(
    @PathVariable Long bookingId,
    @RequestParam("payment_proof") MultipartFile file) {

    // 1. Kiểm tra booking
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new NotFoundException("Booking not found"));

    if (!booking.getStatus().equals("PAYING")) {
        throw new BadRequestException("Booking không ở trạng thái PAYING");
    }

    // 2. Upload file
    String fileName = "payment_proof_" + bookingId + "_" +
                      System.currentTimeMillis() +
                      getFileExtension(file.getOriginalFilename());
    String uploadDir = "uploads/";
    Path path = Paths.get(uploadDir + fileName);
    Files.write(path, file.getBytes());

    // 3. Update booking
    booking.setStatus("PENDING");
    booking.setPaymentProof(fileName);
    bookingRepository.save(booking);

    return ResponseEntity.ok(ApiResponse.success(booking));
}
```

---

## 3. API: Hủy booking hết hạn (Optional - cho frontend gọi thủ công)

**Endpoint:** `DELETE /api/bookings/{booking_id}/cancel-expired`

**Mục đích:** Xóa booking đã hết thời gian thanh toán (5 phút)

**Request:**

- Path parameter: `booking_id` (number)
- Headers: `Authorization: Bearer {token}`

**Response:**

```json
{
  "result": {
    "booking_id": 43,
    "message": "Đã hủy booking do hết thời gian thanh toán"
  }
}
```

**Logic backend:**

1. Kiểm tra booking tồn tại và status = 'PAYING'
2. Kiểm tra thời gian tạo booking (created_at) đã quá 5 phút chưa
3. Xóa booking khỏi database
4. Return kết quả

**SQL mẫu:**

```sql
DELETE FROM bookings
WHERE id = ?
  AND status = 'PAYING'
  AND created_at < NOW() - INTERVAL 5 MINUTE
```

---

## 4. ⭐ SCHEDULED JOB: Tự động xóa booking hết hạn (BẮT BUỘC)

**⚠️ QUAN TRỌNG:** Đây là giải pháp chính để xử lý trường hợp user thoát trang trong lúc đếm ngược!

Frontend countdown chỉ hoạt động khi user đang ở trang thanh toán. Nếu user:

- Đóng tab/browser
- Thoát ra trang khác
- Mất kết nối mạng

→ Booking vẫn còn status = 'PAYING' trong DB và chiếm slot

**Giải pháp:** Backend scheduled job chạy định kỳ để xóa tự động.

### Java/Spring Boot Implementation:

```java
@Component
@EnableScheduling
public class BookingCleanupScheduler {

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Chạy mỗi 1 phút để xóa các booking hết hạn thanh toán
     * Xóa booking có:
     * - status = 'PAYING'
     * - created_at < (hiện tại - 5 phút)
     */
    @Scheduled(fixedRate = 60000) // 60000ms = 1 phút
    public void cancelExpiredBookings() {
        try {
            LocalDateTime expireTime = LocalDateTime.now().minusMinutes(5);

            List<Booking> expiredBookings = bookingRepository
                .findByStatusAndCreatedAtBefore("PAYING", expireTime);

            if (!expiredBookings.isEmpty()) {
                bookingRepository.deleteAll(expiredBookings);

                log.info("Đã xóa {} booking hết hạn thanh toán",
                         expiredBookings.size());
            }
        } catch (Exception e) {
            log.error("Lỗi khi xóa booking hết hạn: {}", e.getMessage());
        }
    }
}
```

### Repository method:

```java
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStatusAndCreatedAtBefore(
        String status,
        LocalDateTime createdAt
    );
}
```

### SQL Query tương đương:

```sql
DELETE FROM bookings
WHERE status = 'PAYING'
  AND created_at < NOW() - INTERVAL 5 MINUTE;
```

### Lưu ý quan trọng:

1. **Tần suất chạy:** 1 phút là hợp lý. Không nên quá thấp (tốn resource) hoặc quá cao (booking bị giữ lâu)

2. **Logging:** Nên log để theo dõi số booking bị xóa

3. **Timezone:** Đảm bảo server time và DB time đồng bộ

4. **Error handling:** Bọc trong try-catch để không làm crash app

5. **Testing:** Test bằng cách set timeout ngắn hơn (ví dụ 1 phút) khi dev

### Testing scheduled job:

```java
// Test với timeout ngắn hơn cho môi trường dev
@Scheduled(fixedRate = 60000)
public void cancelExpiredBookings() {
    // Dev: 1 phút, Production: 5 phút
    int timeoutMinutes = environment.equals("production") ? 5 : 1;

    LocalDateTime expireTime = LocalDateTime.now()
        .minusMinutes(timeoutMinutes);

    // ... logic xóa
}
```

---

## 4. Sửa API: Tạo booking (confirmation)

**Endpoint:** `POST /api/bookings/confirmation`

**Cần sửa để:**

- Tạo booking với status = 'PAYING' (thay vì 'PENDING')
- Lưu thời gian tạo (created_at) để tính timeout

**Request:**

```json
body như này ở fe đã có, chỉ cần sửa lại message cho phù hợp
{
  "user_id": 1,
  "court_id": 30,
  "booking_date": "2025-11-23",
  "time_slots": [{ "start_time": "18:00", "end_time": "19:00" }],
  "total_price": 200000,
  "status": "PAYING",
  "court_group_id": 22
}
```

**Response:**

```json
{
  "result": {
    "booking_id": 43,
    "status": "PAYING",
    "created_at": "2025-11-23T15:52:39",
    "message": "Đã tạo booking. Vui lòng thanh toán trong 5 phút"
  }
}
```

---

## 5. Cập nhật Database Schema

### Thêm cột vào bảng `bookings`:

```sql
ALTER TABLE bookings
ADD COLUMN payment_proof VARCHAR(255) DEFAULT NULL
COMMENT 'Tên file ảnh chuyển khoản';
```

### Đảm bảo cột `created_at` có default:

```sql
ALTER TABLE bookings
MODIFY COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
```

---

## 6. Flow tổng quan

1. **User chọn sân và giờ** → Click "Đặt sân"
2. **API: POST /bookings/confirmation**
   - Tạo booking với status = 'PAYING'
   - Return booking_id
3. **Navigate sang PaymentPage** với booking_id
4. **API: GET /bookings/{id}/payment-info**
   - Lấy thông tin ngân hàng owner
5. **User chuyển khoản và upload ảnh**
6. **API: POST /bookings/{id}/confirm-payment**
   - Upload ảnh
   - Update status = 'PENDING'
7. **Owner xem và xác nhận** → Update status = 'CONFIRMED'

### Nếu hết 5 phút:

- **API: DELETE /bookings/{id}/cancel-expired**
- Hoặc background job tự động xóa

---

## 7. Testing APIs

### Test lấy thông tin thanh toán:

```bash
curl -X GET http://localhost:8080/api/bookings/43/payment-info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test xác nhận thanh toán:

```bash
curl -X POST http://localhost:8080/api/bookings/43/confirm-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "payment_proof=@/path/to/image.jpg" \
  -F "booking_id=43"
```

### Test hủy booking hết hạn:

```bash
curl -X DELETE http://localhost:8080/api/bookings/43/cancel-expired \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 8. Các trường hợp cần xử lý

1. **Booking không tồn tại** → 404 Not Found
2. **Status không phải PAYING** → 400 Bad Request
3. **File upload quá lớn** → 413 Payload Too Large
4. **File không phải ảnh** → 400 Bad Request
5. **Hết thời gian nhưng đã thanh toán** → Không xóa
6. **User không có quyền** → 403 Forbidden

---

## Tóm tắt

3 API chính cần implement:

1. **GET /bookings/{id}/payment-info** - Lấy thông tin thanh toán
2. **POST /bookings/{id}/confirm-payment** - Upload ảnh + Update status
3. **DELETE /bookings/{id}/cancel-expired** - Xóa booking hết hạn

Plus: Sửa API confirmation để tạo booking với status = 'PAYING'
