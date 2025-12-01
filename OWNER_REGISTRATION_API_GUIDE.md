# Hướng dẫn API Backend - Đăng ký Đối tác (Owner)

## 📋 Tổng quan

API cho phép người dùng đăng ký trở thành đối tác (chủ sân) với role = `OWNER` và status = `PENDING`.

---

## 🔥 API: Đăng ký tài khoản Owner

**Endpoint:** `POST /api/auth/register-owner`

**Content-Type:** `multipart/form-data` (do có upload file)

### Request

**FormData Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | ✅ | Họ và tên |
| `email` | string | ✅ | Email (unique) |
| `password` | string | ✅ | Mật khẩu (min 6 ký tự) |
| `phone` | string | ✅ | Số điện thoại (10 số) |
| `bankName` | string | ✅ | Tên ngân hàng |
| `bankAccountNumber` | string | ✅ | Số tài khoản |
| `bankAccountName` | string | ✅ | Tên chủ tài khoản (IN HOA) |
| `idCardFront` | File | ✅ | Ảnh mặt trước CMND/CCCD |
| `idCardBack` | File | ✅ | Ảnh mặt sau CMND/CCCD |
| `bankQrImage` | File | ⚠️ | Ảnh QR code ngân hàng (optional) |

### Response Success (201)

```json
{
  "success": true,
  "message": "Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong 24-48 giờ.",
  "result": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "email": "owner@example.com",
    "phone": "0123456789",
    "role": "OWNER",
    "ownerStatus": "PENDING",
    "createdAt": "2025-11-23T16:30:00"
  }
}
```

### Response Error

**400 - Bad Request (Validation error):**
```json
{
  "success": false,
  "message": "Email đã tồn tại"
}
```

**400 - Missing files:**
```json
{
  "success": false,
  "message": "Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt"
}
```

---

## 💻 Implementation Guide

### Java/Spring Boot

#### 1. Controller

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(value = "/register-owner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> registerOwner(
            @RequestParam("fullName") String fullName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("phone") String phone,
            @RequestParam("bankName") String bankName,
            @RequestParam("bankAccountNumber") String bankAccountNumber,
            @RequestParam("bankAccountName") String bankAccountName,
            @RequestParam("idCardFront") MultipartFile idCardFront,
            @RequestParam("idCardBack") MultipartFile idCardBack,
            @RequestParam(value = "bankQrImage", required = false) MultipartFile bankQrImage
    ) {
        try {
            // 1. Validate
            if (userService.existsByEmail(email)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Email đã tồn tại"));
            }

            if (idCardFront.isEmpty() || idCardBack.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt"));
            }

            // 2. Upload files
            String idCardFrontPath = fileStorageService.storeFile(
                idCardFront, 
                "id_cards/front_" + System.currentTimeMillis()
            );

            String idCardBackPath = fileStorageService.storeFile(
                idCardBack, 
                "id_cards/back_" + System.currentTimeMillis()
            );

            String bankQrPath = null;
            if (bankQrImage != null && !bankQrImage.isEmpty()) {
                bankQrPath = fileStorageService.storeFile(
                    bankQrImage, 
                    "bank_qr/" + System.currentTimeMillis()
                );
            }

            // 3. Create user
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password)); // Hash password
            user.setPhone(phone);
            user.setRole(UserRole.OWNER);
            user.setOwnerStatus(OwnerStatus.PENDING);
            user.setBankName(bankName);
            user.setBankAccountNumber(bankAccountNumber);
            user.setBankAccountName(bankAccountName);
            user.setIdCardFront(idCardFrontPath);
            user.setIdCardBack(idCardBackPath);
            user.setBankQrImage(bankQrPath);
            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userService.save(user);

            // 4. Send notification email to admin
            emailService.sendOwnerRegistrationNotification(savedUser);

            // 5. Send confirmation email to owner
            emailService.sendOwnerRegistrationConfirmation(savedUser.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                    "Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong 24-48 giờ.",
                    mapToDTO(savedUser)
                ));

        } catch (Exception e) {
            log.error("Error registering owner: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Có lỗi xảy ra. Vui lòng thử lại sau."));
        }
    }
}
```

#### 2. FileStorageService

```java
@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String customFileName) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File rỗng");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File phải là ảnh");
        }

        // Get extension
        String originalFileName = file.getOriginalFilename();
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // Create unique filename
        String fileName = customFileName + extension;

        // Create directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Save file
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }

    public Resource loadFileAsResource(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(fileName);
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists()) {
            return resource;
        } else {
            throw new FileNotFoundException("File not found: " + fileName);
        }
    }
}
```

#### 3. application.properties

```properties
# File upload configuration
file.upload-dir=uploads/
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=20MB
```

#### 4. Serve uploaded files

```java
@RestController
@RequestMapping("/api/uploads")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName);
            
            String contentType = "image/jpeg";
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
                
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
```

#### 5. Enums

```java
public enum UserRole {
    USER,
    ADMIN,
    OWNER
}

public enum OwnerStatus {
    PENDING,    // Chờ duyệt
    APPROVED,   // Đã duyệt
    REJECTED,   // Từ chối
    BANNED      // Bị cấm
}
```

---

## 🔐 Security Notes

### Password Hashing
**BẮT BUỘC** hash password trước khi lưu DB:

```java
@Autowired
private BCryptPasswordEncoder passwordEncoder;

user.setPassword(passwordEncoder.encode(password));
```

### File Validation
Validate file type và size:

```java
// Check file type
if (!file.getContentType().startsWith("image/")) {
    throw new BadRequestException("File phải là ảnh");
}

// Check file size (< 5MB)
if (file.getSize() > 5 * 1024 * 1024) {
    throw new BadRequestException("File không được quá 5MB");
}
```

### Email Validation
```java
private boolean isValidEmail(String email) {
    String regex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
    return email.matches(regex);
}
```

### Phone Validation
```java
private boolean isValidPhone(String phone) {
    return phone.matches("^[0-9]{10}$");
}
```

---

## 📧 Email Templates

### 1. Email gửi cho Admin (khi có đơn mới)

**Subject:** Đơn đăng ký đối tác mới - [Tên người đăng ký]

**Body:**
```html
<h2>Đơn đăng ký đối tác mới</h2>
<p>Có một đơn đăng ký đối tác mới cần xem xét:</p>

<ul>
  <li><strong>Họ tên:</strong> Nguyen Van A</li>
  <li><strong>Email:</strong> owner@example.com</li>
  <li><strong>Số điện thoại:</strong> 0123456789</li>
  <li><strong>Ngân hàng:</strong> Vietcombank - 1234567890</li>
  <li><strong>Thời gian đăng ký:</strong> 23/11/2025 16:30</li>
</ul>

<p><a href="http://admin.example.com/pending-owners/10">Xem chi tiết và phê duyệt</a></p>
```

### 2. Email gửi cho Owner (xác nhận đã nhận đơn)

**Subject:** Đã nhận đơn đăng ký đối tác của bạn

**Body:**
```html
<h2>Cảm ơn bạn đã đăng ký!</h2>
<p>Chúng tôi đã nhận được đơn đăng ký trở thành đối tác của bạn.</p>

<p><strong>Thông tin đăng ký:</strong></p>
<ul>
  <li>Họ tên: Nguyen Van A</li>
  <li>Email: owner@example.com</li>
  <li>Số điện thoại: 0123456789</li>
</ul>

<p>Chúng tôi sẽ xem xét và phản hồi trong vòng <strong>24-48 giờ</strong>.</p>

<p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ: support@example.com</p>
```

---

## 🔄 Owner Status Flow

```
┌──────────┐
│ PENDING  │  ← User vừa đăng ký
└────┬─────┘
     │
     ├──→ Admin approve ──→ ┌──────────┐
     │                      │ APPROVED │  ← Có thể login và đăng sân
     │                      └──────────┘
     │
     └──→ Admin reject ───→ ┌──────────┐
                            │ REJECTED │  ← Không thể login
                            └──────────┘
```

---

## 🧪 Testing với Postman

### Request

```
POST http://localhost:8080/api/auth/register-owner
Content-Type: multipart/form-data

Form Data:
- fullName: Nguyen Van A
- email: owner@example.com
- password: 123456
- phone: 0123456789
- bankName: Vietcombank
- bankAccountNumber: 1234567890
- bankAccountName: NGUYEN VAN A
- idCardFront: [Choose file]
- idCardBack: [Choose file]
- bankQrImage: [Choose file] (optional)
```

### Testing với curl

```bash
curl -X POST http://localhost:8080/api/auth/register-owner \
  -F "fullName=Nguyen Van A" \
  -F "email=owner@example.com" \
  -F "password=123456" \
  -F "phone=0123456789" \
  -F "bankName=Vietcombank" \
  -F "bankAccountNumber=1234567890" \
  -F "bankAccountName=NGUYEN VAN A" \
  -F "idCardFront=@/path/to/front.jpg" \
  -F "idCardBack=@/path/to/back.jpg" \
  -F "bankQrImage=@/path/to/qr.jpg"
```

---

## 📝 Database Migration

### Check if columns exist

```sql
-- Kiểm tra các cột đã tồn tại chưa
SHOW COLUMNS FROM users LIKE 'owner_status';
SHOW COLUMNS FROM users LIKE 'id_card_front';
SHOW COLUMNS FROM users LIKE 'bank_name';
```

### Add missing columns (if needed)

```sql
-- Thêm cột nếu chưa có
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS owner_status 
  ENUM('PENDING','APPROVED','REJECTED','BANNED') DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id_card_front VARCHAR(255) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS id_card_back VARCHAR(255) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_qr_image VARCHAR(255) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255) DEFAULT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS owner_verified_at DATETIME DEFAULT NULL;
```

### Add indexes

```sql
CREATE INDEX idx_owner_status ON users(owner_status);
CREATE INDEX idx_role_owner_status ON users(role, owner_status);
```

---

## 🎯 Checklist Implementation

### Backend
- [ ] Tạo endpoint `POST /auth/register-owner`
- [ ] Implement file upload service
- [ ] Hash password với BCrypt
- [ ] Validate email, phone, files
- [ ] Save user với role=OWNER, status=PENDING
- [ ] Gửi email thông báo cho admin
- [ ] Gửi email xác nhận cho owner
- [ ] Tạo endpoint serve files `/uploads/{fileName}`
- [ ] Test với Postman/curl

### Database
- [ ] Kiểm tra các cột đã tồn tại
- [ ] Thêm index cho performance
- [ ] Test insert/update records

### Security
- [ ] Validate file type (chỉ ảnh)
- [ ] Limit file size (< 5-10MB)
- [ ] Hash password
- [ ] Sanitize input
- [ ] Add rate limiting (prevent spam)

### Frontend
- [x] Tạo trang CollaborationPage
- [x] Form với validation
- [x] Upload files với preview
- [x] Notifications
- [ ] Test end-to-end

---

## 🚀 Production Checklist

- [ ] Configure upload directory (persistent storage)
- [ ] Setup CORS cho multipart/form-data
- [ ] Configure max file size
- [ ] Setup email service (SMTP)
- [ ] Add logging
- [ ] Add monitoring
- [ ] Security scan uploaded files (virus scan)
- [ ] Backup uploaded files

---

## 📚 Related APIs (Cần implement sau)

1. **GET /admin/pending-owners** - Admin xem danh sách owner chờ duyệt
2. **PUT /admin/owners/{id}/approve** - Admin duyệt owner
3. **PUT /admin/owners/{id}/reject** - Admin từ chối owner
4. **GET /owners/my-info** - Owner xem thông tin của mình
5. **PUT /owners/update-profile** - Owner cập nhật thông tin

---

Chúc implement thành công! 🎉











