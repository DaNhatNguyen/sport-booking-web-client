# Phân tích Logic Booking → Payment Flow

## 📋 Tổng quan Flow hiện tại

### 1. CourtBookingTable.tsx → PaymentPage.tsx

**Bước 1: User chọn sân và khung giờ**
- `handleBookingClick()`: Validate và tạo `confirmationPayload`
- Hiển thị modal xác nhận

**Bước 2: User xác nhận đặt sân**
- `handleClickConfirmBooking()`: 
  - Gọi API `getBookingConfirmation(confirmationData)`
  - Nhận `apiResult` với `booking_id`
  - Tạo `paymentData = { ...confirmationData, booking_id }`
  - Navigate sang `/payment` với `paymentData`

**Bước 3: PaymentPage nhận dữ liệu**
- Nhận `bookingData` từ `location.state`
- Gọi `getPaymentInfo(booking_id)` để lấy thông tin thanh toán
- Tính thời gian còn lại dựa trên `createdAt`

---

## ✅ Điểm tốt trong logic hiện tại

1. **Validation đầy đủ**: Kiểm tra slots cùng sân, liền kề nhau
2. **Tách biệt rõ ràng**: Booking confirmation và Payment là 2 bước riêng
3. **Error handling**: Có try-catch và notifications
4. **Timeout logic**: PaymentPage có countdown timer

---

## ⚠️ Vấn đề và cải thiện cần thiết

### Vấn đề 1: Thiếu `created_at` trong paymentData

**Hiện tại:**
```typescript
// CourtBookingTable.tsx - line 281-284
const paymentData = {
  ...confirmationData,  // Không có created_at
  booking_id: apiResult.booking_id,
};
```

**PaymentPage.tsx - line 119:**
```typescript
const bookingCreatedAt = new Date(data.createdAt || bookingData.created_at);
// bookingData.created_at không tồn tại!
```

**Giải pháp:**
- Nên lưu `created_at` từ API response vào `paymentData` để có thể tính toán ngay
- Tuy nhiên, vẫn nên ưu tiên dùng `data.createdAt` từ `getPaymentInfo` (chính xác hơn)

### Vấn đề 2: Thiếu xử lý khi API không trả về `createdAt`

**PaymentPage.tsx - line 119:**
```typescript
const bookingCreatedAt = new Date(data.createdAt || bookingData.created_at);
```

Nếu cả 2 đều không có, sẽ tạo Date với `Invalid Date`.

**Giải pháp:**
```typescript
const bookingCreatedAt = data.createdAt 
  ? new Date(data.createdAt) 
  : bookingData?.created_at 
    ? new Date(bookingData.created_at)
    : new Date(); // Fallback về thời gian hiện tại
```

### Vấn đề 3: Không có validation userId trước khi đặt sân

**CourtBookingTable.tsx - line 231-235:**
```typescript
const storedUser = localStorage.getItem('user');
var userId;
if (storedUser) {
  userId = JSON.parse(storedUser).id;
}
// userId có thể undefined!
```

**Giải pháp:**
- Nên kiểm tra `userId` trước khi cho phép đặt sân
- Redirect về login nếu chưa đăng nhập

### Vấn đề 4: Thiếu xử lý khi navigate không có booking_id

**PaymentPage.tsx - line 104-112:**
```typescript
if (!bookingData?.booking_id) {
  notifications.show({...});
  navigate('/');
  return;
}
```

✅ Logic này đã tốt, nhưng nên thêm log để debug.

---

## 🔧 Hướng dẫn sửa code

### Sửa 1: CourtBookingTable.tsx - Lưu created_at vào paymentData

```typescript
const handleClickConfirmBooking = async () => {
  try {
    setLoading(true);
    const apiResult = await getBookingConfirmation(confirmationData);

    // ✅ Sửa: Lưu cả created_at từ API response
    const paymentData = {
      ...confirmationData,
      booking_id: apiResult.booking_id,
      created_at: apiResult.created_at || new Date().toISOString(), // Fallback nếu API không trả về
    };

    console.log('Payment data with booking_id:', paymentData);

    navigate(`/payment`, {
      state: paymentData,
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận đặt sân:', error);
    notifications.show({
      title: 'Lỗi',
      message: 'Có lỗi xảy ra khi đặt sân. Vui lòng thử lại!',
      color: 'red',
    });
  } finally {
    setLoading(false);
  }
};
```

### Sửa 2: CourtBookingTable.tsx - Validate userId

```typescript
const handleBookingClick = async () => {
  // ✅ Thêm: Kiểm tra user đã đăng nhập chưa
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    notifications.show({
      title: 'Yêu cầu đăng nhập',
      message: 'Vui lòng đăng nhập để đặt sân',
      color: 'yellow',
    });
    navigate('/login');
    return;
  }

  const userId = JSON.parse(storedUser).id;
  if (!userId) {
    notifications.show({
      title: 'Lỗi',
      message: 'Không tìm thấy thông tin người dùng',
      color: 'red',
    });
    return;
  }

  // ... phần còn lại của code
};
```

### Sửa 3: PaymentPage.tsx - Xử lý created_at an toàn hơn

```typescript
// Fetch payment info
useEffect(() => {
  const fetchPaymentInfo = async () => {
    if (!bookingData?.booking_id) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không tìm thấy thông tin đặt sân',
        color: 'red',
      });
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const data = await getPaymentInfo(bookingData.booking_id);

      // ✅ Sửa: Xử lý created_at an toàn hơn
      let bookingCreatedAt: Date;
      if (data.createdAt) {
        bookingCreatedAt = new Date(data.createdAt);
      } else if (bookingData.created_at) {
        bookingCreatedAt = new Date(bookingData.created_at);
      } else {
        // Fallback: Dùng thời gian hiện tại (không lý tưởng nhưng tránh crash)
        console.warn('Không tìm thấy created_at, dùng thời gian hiện tại');
        bookingCreatedAt = new Date();
      }

      // Validate Date
      if (isNaN(bookingCreatedAt.getTime())) {
        console.error('Invalid date:', data.createdAt, bookingData.created_at);
        bookingCreatedAt = new Date(); // Fallback
      }

      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - bookingCreatedAt.getTime()) / 1000);

      if (elapsedSeconds >= PAYMENT_TIMEOUT) {
        setExpired(true);
        setTimeLeft(0);
        await handleExpiredBooking();
        return;
      }

      setTimeLeft(PAYMENT_TIMEOUT - elapsedSeconds);
      setPaymentInfo(data);
    } catch (error: any) {
      // ... phần xử lý error giữ nguyên
    } finally {
      setLoading(false);
    }
  };

  fetchPaymentInfo();
}, [bookingData?.booking_id]);
```

### Sửa 4: PaymentPage.tsx - Thêm log để debug

```typescript
// ✅ Thêm: Log để debug
console.log('PaymentPage - bookingData:', bookingData);
console.log('PaymentPage - booking_id:', bookingData?.booking_id);
```

---

## 📝 Checklist Backend API

Đảm bảo các API sau trả về đúng format:

### 1. POST /api/bookings/confirmation

**Response phải có:**
```json
{
  "result": {
    "booking_id": 43,
    "created_at": "2025-11-23T15:52:39",  // ✅ QUAN TRỌNG
    "status": "PAYING",
    "message": "Đã tạo booking. Vui lòng thanh toán trong 5 phút"
  }
}
```

### 2. GET /api/bookings/{id}/payment-info

**Response phải có:**
```json
{
  "result": {
    "bookingId": 43,
    "createdAt": "2025-11-23T15:52:39",  // ✅ QUAN TRỌNG
    "totalPrice": 200000,
    "bookingDate": "2025-11-30",
    "timeSlots": [...],
    "courtName": "...",
    "fullAddress": "...",
    "ownerBankName": "...",
    "ownerBankAccountNumber": "...",
    "ownerBankAccountName": "...",
    "ownerBankQrImage": "..."
  }
}
```

---

## 🎯 Tóm tắt các thay đổi cần thiết

1. ✅ **CourtBookingTable.tsx**: 
   - Validate userId trước khi đặt sân
   - Lưu `created_at` từ API response vào `paymentData`

2. ✅ **PaymentPage.tsx**: 
   - Xử lý `created_at` an toàn hơn với fallback
   - Thêm log để debug

3. ✅ **Backend API**: 
   - Đảm bảo trả về `created_at` trong cả 2 API

---

## 🚀 Kết luận

Logic hiện tại **đã khá tốt** nhưng cần cải thiện:
- ✅ Validation userId
- ✅ Xử lý `created_at` an toàn hơn
- ✅ Đảm bảo Backend trả về đầy đủ thông tin

Sau khi sửa, flow sẽ **ổn định và an toàn hơn**.




