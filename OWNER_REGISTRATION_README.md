# 🤝 Trang Đăng ký Đối tác - Quick Guide

## 📋 Đã hoàn thành

### ✅ Frontend

- **File mới:** `src/pages/CollaborationPage.tsx`
- **Cập nhật:** `src/services/authService.ts` (thêm `registerOwner()`)
- **Cập nhật:** `src/routes/AppRoutes.tsx` (route `/collaboration`)

### 📚 Documentation

1. **`OWNER_REGISTRATION_API_GUIDE.md`** - Hướng dẫn backend API chi tiết
2. **`OWNER_REGISTRATION_FRONTEND_GUIDE.md`** - Hướng dẫn frontend chi tiết

---

## 🎯 Tính năng

### **Multi-step Form (3 bước)**

**Bước 1: Thông tin cá nhân**

- Họ tên, Email, Số điện thoại
- Mật khẩu + Xác nhận mật khẩu

**Bước 2: Thông tin ngân hàng**

- Chọn ngân hàng (24 ngân hàng)
- Số tài khoản, Tên chủ tài khoản
- Upload QR code (optional)

**Bước 3: Giấy tờ xác thực**

- Upload CMND/CCCD mặt trước
- Upload CMND/CCCD mặt sau
- Preview ảnh trước khi submit

---

## 🔌 Backend cần implement

### **API: POST `/api/auth/register-owner`**

**Request:** `multipart/form-data`

```typescript
FormData {
  fullName: string
  email: string
  password: string
  phone: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  idCardFront: File
  idCardBack: File
  bankQrImage: File (optional)
}
```

**Logic:**

1. Validate email chưa tồn tại
2. Hash password
3. Upload 3 files (id_card_front, id_card_back, bank_qr_image)
4. Create user với:
   - `role = 'OWNER'`
   - `owner_status = 'PENDING'`

**Response Success (201):**

```json
{
  "success": true,
  "message": "Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong 24-48 giờ.",
  "result": {
    "id": 10,
    "fullName": "Nguyen Van A",
    "email": "owner@example.com",
    "role": "OWNER",
    "ownerStatus": "PENDING"
  }
}
```

---

## 🗄️ Database Schema

### Table: `users`

**Các cột cần thiết:**

```sql
- id (bigint, PK)
- full_name (varchar)
- email (varchar, unique)
- password (varchar) -- HASHED
- phone (varchar)
- role (ENUM: USER, ADMIN, OWNER)
- owner_status (ENUM: PENDING, APPROVED, REJECTED, BANNED)
- id_card_front (varchar) -- Đường dẫn file
- id_card_back (varchar)
- bank_qr_image (varchar)
- bank_name (varchar)
- bank_account_number (varchar)
- bank_account_name (varchar)
- created_at (datetime)
- updated_at (datetime)
- owner_verified_at (datetime)
```

---

## 🧪 Testing

### Frontend Test

```bash
# Start dev server
npm start

# Navigate to
http://localhost:3000/collaboration
```

### Backend Test với Postman

```
POST http://localhost:8080/api/auth/register-owner

Body: form-data
- fullName: Nguyen Van A
- email: owner@example.com
- password: 123456
- phone: 0123456789
- bankName: Vietcombank
- bankAccountNumber: 1234567890
- bankAccountName: NGUYEN VAN A
- idCardFront: [file]
- idCardBack: [file]
- bankQrImage: [file]
```

---

## 📊 Owner Status Flow

```
User đăng ký
    ↓
[PENDING] ← Chờ admin duyệt (không thể login)
    ↓
Admin xem xét
    ↓
┌───────┴────────┐
│                │
▼                ▼
[APPROVED]    [REJECTED]
(Có thể login)  (Từ chối)
```

---

## 🎨 Preview

### Desktop

```
┌─────────────────────────────────────────────────┐
│   🤝 Đăng ký trở thành đối tác                   │
├─────────────────────────────────────────────────┤
│   ●─────●─────○  (Stepper)                      │
│   Bước 1  Bước 2  Bước 3                        │
├─────────────────────────────────────────────────┤
│                                                 │
│   [Form fields...]                              │
│                                                 │
│   [Quay lại]              [Tiếp tục]           │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ Lưu ý quan trọng

### Security

- ✅ **BẮT BUỘC** hash password trước khi lưu DB
- ✅ Validate file type (chỉ ảnh)
- ✅ Giới hạn file size (< 5-10MB)
- ✅ Sanitize input để tránh SQL injection

### File Upload

- Lưu file vào thư mục `uploads/`
- Đặt tên file unique: `front_{timestamp}.jpg`
- Serve files qua endpoint `/uploads/{filename}`

---

## 📂 Files Structure

```
frontend/
├── src/
│   ├── pages/
│   │   └── CollaborationPage.tsx        ← MỚI
│   ├── services/
│   │   └── authService.ts               ← CẬP NHẬT
│   └── routes/
│       └── AppRoutes.tsx                ← CẬP NHẬT
│
└── docs/
    ├── OWNER_REGISTRATION_API_GUIDE.md
    ├── OWNER_REGISTRATION_FRONTEND_GUIDE.md
    └── OWNER_REGISTRATION_README.md     ← Đang đọc
```

---

## ✅ Checklist Implementation

### Backend (BẮT BUỘC)

- [ ] Tạo endpoint `POST /auth/register-owner`
- [ ] Upload file service
- [ ] Hash password (BCrypt)
- [ ] Validate email unique
- [ ] Lưu user với role=OWNER, status=PENDING
- [ ] Endpoint serve files `/uploads/{filename}`

### Database

- [ ] Kiểm tra schema có đủ columns
- [ ] Test insert records

### Testing

- [ ] Test API với Postman
- [ ] Test upload files
- [ ] Test validation
- [ ] Test end-to-end flow

---

## 🚀 Next Steps (Sau khi implement API)

1. **Admin Dashboard:**

   - Xem danh sách owner pending
   - Approve/Reject owner
   - Xem giấy tờ đã upload

2. **Owner Dashboard:**
   - Login (chỉ khi approved)
   - Xem trạng thái đơn
   - Đăng sân của mình










