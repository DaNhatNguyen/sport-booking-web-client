# 📝 Hướng dẫn Frontend - Trang Đăng ký Đối tác

## 🎯 Tổng quan

Trang đăng ký cho phép chủ sân (Owner) đăng ký tài khoản để quản lý và cho thuê sân thể thao trên nền tảng.

**URL:** `/collaboration`

**Component:** `CollaborationPage.tsx`

---

## ✨ Tính năng

### 🔢 Multi-step Form (3 bước)

#### **Bước 1: Thông tin cá nhân**
- ✅ Họ và tên (validation: min 3 ký tự)
- ✅ Email (validation: format email)
- ✅ Số điện thoại (validation: 10 số)
- ✅ Mật khẩu (validation: min 6 ký tự)
- ✅ Xác nhận mật khẩu (validation: khớp với password)

#### **Bước 2: Thông tin ngân hàng**
- ✅ Ngân hàng (Select với 24 ngân hàng phổ biến)
- ✅ Số tài khoản
- ✅ Tên chủ tài khoản (tự động uppercase)
- ✅ Ảnh QR code (Optional) - với preview

#### **Bước 3: Giấy tờ xác thực**
- ✅ Upload CMND/CCCD mặt trước
- ✅ Upload CMND/CCCD mặt sau
- ✅ Preview ảnh trước khi submit

#### **Review & Submit**
- ✅ Tóm tắt quy trình phê duyệt
- ✅ Submit form với tất cả dữ liệu

---

## 🎨 UI/UX Features

### 1. **Stepper Navigation**
```tsx
<Stepper active={active} onStepClick={setActive}>
  <Stepper.Step label="Bước 1" description="Thông tin cá nhân" />
  <Stepper.Step label="Bước 2" description="Thông tin ngân hàng" />
  <Stepper.Step label="Bước 3" description="Giấy tờ xác thực" />
  <Stepper.Completed>Review & Submit</Stepper.Completed>
</Stepper>
```

### 2. **Form Validation với Mantine Form**
- Real-time validation
- Error messages hiển thị rõ ràng
- Chỉ cho phép next step khi validation pass

### 3. **File Upload với Preview**
```tsx
<FileInput
  accept="image/*"
  value={idCardFront}
  onChange={setIdCardFront}
/>

{idCardFront && (
  <Image 
    src={URL.createObjectURL(idCardFront)} 
    alt="Preview"
  />
)}
```

### 4. **Notifications**
- ✅ Thành công → Navigate to login
- ❌ Lỗi → Hiển thị error message
- ⚠️ Warning → Thiếu thông tin

### 5. **Responsive Design**
- Desktop: 2 cột cho upload files
- Mobile: 1 cột stack vertical

---

## 📁 File Structure

```
src/
├── pages/
│   └── CollaborationPage.tsx        // Main component
├── services/
│   └── authService.ts               // API call: registerOwner()
└── routes/
    └── AppRoutes.tsx                // Route: /collaboration
```

---

## 🔌 API Integration

### Function: `registerOwner()`

**File:** `src/services/authService.ts`

```typescript
export const registerOwner = async (formData: FormData): Promise<any> => {
  const res = await axios.post(`${API_BASE}/auth/register-owner`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};
```

### FormData Structure

```typescript
const formData = new FormData();
formData.append('fullName', 'Nguyen Van A');
formData.append('email', 'owner@example.com');
formData.append('password', '123456');
formData.append('phone', '0123456789');
formData.append('bankName', 'Vietcombank');
formData.append('bankAccountNumber', '1234567890');
formData.append('bankAccountName', 'NGUYEN VAN A');
formData.append('idCardFront', idCardFrontFile);
formData.append('idCardBack', idCardBackFile);
formData.append('bankQrImage', bankQrFile); // Optional
```

---

## 🧪 Testing Flow

### Test Case 1: Happy Path - Đăng ký thành công

**Steps:**
1. Vào `/collaboration`
2. **Bước 1:** Nhập thông tin cá nhân đầy đủ → Click "Tiếp tục"
3. **Bước 2:** Chọn ngân hàng, nhập STK, tên TK → Click "Tiếp tục"
4. **Bước 3:** Upload ảnh CMND 2 mặt → Click "Xem lại"
5. **Review:** Kiểm tra thông tin → Click "Gửi đơn đăng ký"
6. ✅ Notification thành công
7. ✅ Redirect to `/login` sau 2 giây

**Expected:**
- Form submit thành công
- Notification: "Đăng ký thành công! Chúng tôi sẽ xem xét..."
- Navigate to login page

### Test Case 2: Validation Errors

**Steps:**
1. **Bước 1:** 
   - Nhập email sai format → Error: "Email không hợp lệ"
   - Password < 6 ký tự → Error: "Mật khẩu phải có ít nhất 6 ký tự"
   - Confirm password khác password → Error: "Mật khẩu không khớp"
   - Phone không phải 10 số → Error: "Số điện thoại không hợp lệ"

2. Không thể click "Tiếp tục" khi có lỗi

### Test Case 3: Missing Files

**Steps:**
1. Điền form đầy đủ đến Bước 3
2. Không upload ảnh CMND
3. Click "Gửi đơn đăng ký"

**Expected:**
- ⚠️ Notification: "Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt"
- Form không submit

### Test Case 4: API Error

**Steps:**
1. Backend không chạy hoặc network error
2. Submit form

**Expected:**
- ❌ Notification: "Không thể đăng ký. Vui lòng thử lại sau."
- User vẫn ở trang đăng ký

### Test Case 5: Email đã tồn tại

**Steps:**
1. Đăng ký với email đã có trong DB
2. Submit form

**Expected:**
- ❌ Notification: "Email đã tồn tại"
- User có thể sửa email và thử lại

---

## 🎯 Form Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| fullName | min 3 chars | "Họ tên phải có ít nhất 3 ký tự" |
| email | valid email format | "Email không hợp lệ" |
| password | min 6 chars | "Mật khẩu phải có ít nhất 6 ký tự" |
| confirmPassword | match password | "Mật khẩu không khớp" |
| phone | exactly 10 digits | "Số điện thoại không hợp lệ" |
| bankName | not empty | "Vui lòng chọn ngân hàng" |
| bankAccountNumber | not empty | "Vui lòng nhập số tài khoản" |
| bankAccountName | not empty | "Vui lòng nhập tên chủ tài khoản" |
| idCardFront | file required | "Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt" |
| idCardBack | file required | "Vui lòng tải lên ảnh CMND/CCCD cả 2 mặt" |

---

## 📊 State Management

```typescript
// Form data
const form = useForm<OwnerRegistrationForm>({
  initialValues: { ... },
  validate: { ... }
});

// Stepper
const [active, setActive] = useState(0);

// Files
const [idCardFront, setIdCardFront] = useState<File | null>(null);
const [idCardBack, setIdCardBack] = useState<File | null>(null);
const [bankQrImage, setBankQrImage] = useState<File | null>(null);

// Loading states
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

---

## 🏦 Danh sách Ngân hàng

24 ngân hàng phổ biến tại Việt Nam:

```typescript
const BANK_LIST = [
  'Vietcombank', 'BIDV', 'Vietinbank', 'Agribank',
  'Techcombank', 'MB Bank', 'ACB', 'VPBank',
  'TPBank', 'Sacombank', 'HDBank', 'VIB',
  'SHB', 'OCB', 'MSB', 'SeABank',
  'VietCapital Bank', 'BacA Bank', 'PVcomBank',
  'Oceanbank', 'NCB', 'BVBank', 'Cake Bank', 'Timo'
];
```

---

## 💡 Code Highlights

### Auto Uppercase cho Bank Account Name

```typescript
<TextInput
  {...form.getInputProps('bankAccountName')}
  style={{ textTransform: 'uppercase' }}
  onChange={(e) =>
    form.setFieldValue('bankAccountName', e.target.value.toUpperCase())
  }
/>
```

### Conditional Validation per Step

```typescript
const form = useForm({
  validate: (values) => {
    if (active === 0) {
      return { /* validate step 1 */ };
    }
    if (active === 1) {
      return { /* validate step 2 */ };
    }
    return {};
  }
});
```

### Image Preview

```typescript
{idCardFront && (
  <Image
    src={URL.createObjectURL(idCardFront)}
    alt="ID card front"
    radius="md"
    h={150}
    fit="contain"
  />
)}
```

---

## 🔒 Security Considerations

### Frontend
- ✅ Validate file type (chỉ chấp nhận ảnh)
- ✅ Preview ảnh trước khi upload
- ✅ Hide password input
- ✅ Email format validation
- ⚠️ Không validate file size (backend sẽ handle)

### What Backend Should Do
- Hash password
- Validate file type & size
- Sanitize input
- Check email uniqueness
- Rate limiting

---

## 🎨 Styling & Layout

### Colors
- Primary: Blue (Mantine default)
- Success: Green
- Warning: Yellow
- Error: Red

### Spacing
- Container: `lg` (1140px)
- Paper padding: `xl`
- Stack gap: `md`

### Icons
From `@tabler/icons-react`:
- `IconUser`, `IconMail`, `IconPhone`, `IconLock`
- `IconBuildingBank`, `IconCreditCard`, `IconUpload`
- `IconCheck`, `IconAlertCircle`, `IconFileUpload`

---

## 📱 Responsive Breakpoints

```tsx
<Grid.Col span={{ base: 12, md: 6 }}>
  {/* Full width on mobile, half on desktop */}
</Grid.Col>
```

---

## 🚀 Navigation Flow

```
/collaboration (Đăng ký)
       ↓
  Submit form
       ↓
  API Success
       ↓
/login (Đăng nhập)
       ↓
  [PENDING] → Chờ admin duyệt
       ↓
  Admin approve
       ↓
  [APPROVED] → Owner dashboard
```

---

## 📧 Post-Registration

Sau khi đăng ký thành công:

1. **Owner nhận email xác nhận:**
   - "Đã nhận đơn đăng ký của bạn"
   - "Chúng tôi sẽ xem xét trong 24-48 giờ"

2. **Admin nhận email thông báo:**
   - Thông tin owner mới
   - Link xem chi tiết và phê duyệt

3. **Owner status = PENDING:**
   - Chưa thể login
   - Chờ admin approve

4. **Sau khi admin approve:**
   - Status → APPROVED
   - Owner nhận email: "Tài khoản đã được kích hoạt"
   - Có thể login và đăng sân

---

## 🐛 Common Issues & Solutions

### Issue 1: File không upload được
**Symptom:** FormData không chứa file

**Solution:**
```typescript
// ❌ Sai
formData.append('idCardFront', idCardFront.name);

// ✅ Đúng
formData.append('idCardFront', idCardFront);
```

### Issue 2: CORS error khi upload file
**Backend cần config:**
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### Issue 3: File quá lớn
**Backend config:**
```properties
spring.servlet.multipart.max-file-size=10MB
```

### Issue 4: Preview ảnh bị memory leak
**Solution:** Cleanup object URLs
```typescript
useEffect(() => {
  return () => {
    if (idCardFront) {
      URL.revokeObjectURL(URL.createObjectURL(idCardFront));
    }
  };
}, [idCardFront]);
```

---

## ✅ Checklist

### Development
- [x] Tạo CollaborationPage component
- [x] Implement multi-step form
- [x] Add validation rules
- [x] File upload với preview
- [x] API integration
- [x] Notifications
- [x] Route `/collaboration`
- [ ] Test end-to-end với backend

### Design
- [x] Responsive layout
- [x] Loading states
- [x] Error handling
- [x] Success feedback
- [x] Icons & colors
- [x] Info section (benefits)

### Testing
- [ ] Test validation mỗi field
- [ ] Test file upload
- [ ] Test API success
- [ ] Test API error
- [ ] Test responsive mobile
- [ ] Test navigation flow

---

## 📞 Support

Nếu cần thêm feature:
- [ ] **Auto-fill** từ CMND scan (OCR)
- [ ] **Drag & drop** upload
- [ ] **Webcam** capture cho CMND
- [ ] **Progress indicator** khi upload
- [ ] **Save draft** (lưu form chưa submit)

---

Chúc code vui vẻ! 🎉











