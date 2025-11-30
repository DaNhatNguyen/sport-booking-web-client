# Hướng dẫn API Backend - Top Rated Courts

## Tổng quan
API này trả về danh sách các sân thể thao có đánh giá cao nhất, được sắp xếp theo rating giảm dần.

## Endpoint

```
GET /api/court-groups/top-rated
```

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 4 | Số lượng sân cần lấy (tối đa 4) |

## Request Example

```http
GET /api/court-groups/top-rated?limit=4
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "result": [
    {
      "_id": "18",
      "name": "Sân Tennis Ciputra",
      "type": "Tennis",
      "address": "Khu đô thị Ciputra",
      "district": "Bắc Từ Liêm",
      "province": "Hà Nội",
      "phoneNumber": "0988888888",
      "images": ["image1.png", "image2.png"],
      "openTime": "05:30:00",
      "closeTime": "22:00:00",
      "rating": 4.9,
      "description": "Sân cao cấp trong khu đô thị"
    },
    {
      "_id": "17",
      "name": "Sân Bóng Mỹ Đình",
      "type": "Football",
      "address": "Số 1 Lê Đức Thọ",
      "district": "Nam Từ Liêm",
      "province": "Hà Nội",
      "phoneNumber": "0977777777",
      "images": ["image1.png"],
      "openTime": "05:00:00",
      "closeTime": "23:00:00",
      "rating": 4.8,
      "description": "Sân rộng, thoáng, phù hợp giải đấu"
    }
    // ... tối đa 4 items
  ],
  "message": "Success"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Database Query Logic

### SQL Query

```sql
SELECT 
  id as _id,
  name,
  type,
  address,
  district,
  province,
  phone as phoneNumber,
  image,
  open_time as openTime,
  close_time as closeTime,
  rating,
  description,
  status
FROM court_groups
WHERE is_deleted = 0 
  AND (status = 'approved' OR status IS NULL)
  AND rating > 0
ORDER BY rating DESC
LIMIT 4;
```

### Điều kiện lọc:
1. **is_deleted = 0**: Chỉ lấy sân chưa bị xóa
2. **status = 'approved' OR status IS NULL**: Chỉ lấy sân đã được duyệt hoặc chưa có status
3. **rating > 0**: Chỉ lấy sân có rating > 0
4. **ORDER BY rating DESC**: Sắp xếp theo rating giảm dần
5. **LIMIT 4**: Chỉ lấy 4 sân đầu tiên

## Xử lý hình ảnh

Nếu trường `image` chứa nhiều hình ảnh (phân cách bằng dấu phẩy), cần parse thành array:

```javascript
// Ví dụ: "image1.png,image2.png" -> ["image1.png", "image2.png"]
const images = court.image ? court.image.split(',').map(img => img.trim()) : [];
```

## Implementation Example (Node.js/Express)

### Controller

```javascript
// controllers/courtGroupController.js
exports.getTopRatedCourts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const maxLimit = Math.min(limit, 4); // Tối đa 4 sân

    const topRatedCourts = await CourtGroup.findAll({
      where: {
        is_deleted: 0,
        [Op.or]: [
          { status: 'approved' },
          { status: null }
        ],
        rating: {
          [Op.gt]: 0
        }
      },
      order: [['rating', 'DESC']],
      limit: maxLimit,
      attributes: [
        'id', 'name', 'type', 'address', 'district', 
        'province', 'phone', 'image', 'open_time', 
        'close_time', 'rating', 'description'
      ]
    });

    // Format response
    const formattedCourts = topRatedCourts.map(court => ({
      _id: court.id.toString(),
      name: court.name,
      type: court.type,
      address: court.address,
      district: court.district,
      province: court.province,
      phoneNumber: court.phone,
      images: court.image ? court.image.split(',').map(img => img.trim()) : [],
      openTime: court.open_time,
      closeTime: court.close_time,
      rating: parseFloat(court.rating) || 0,
      description: court.description
    }));

    res.json({
      success: true,
      result: formattedCourts,
      message: 'Success'
    });
  } catch (error) {
    console.error('Error fetching top rated courts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
```

### Route

```javascript
// routes/courtGroupRoutes.js
const express = require('express');
const router = express.Router();
const courtGroupController = require('../controllers/courtGroupController');

router.get('/top-rated', courtGroupController.getTopRatedCourts);

module.exports = router;
```

### Sequelize Model (nếu dùng Sequelize)

```javascript
// models/CourtGroup.js
module.exports = (sequelize, DataTypes) => {
  const CourtGroup = sequelize.define('CourtGroup', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    owner_id: DataTypes.BIGINT,
    name: DataTypes.STRING,
    type: DataTypes.STRING,
    address: DataTypes.STRING,
    district: DataTypes.STRING,
    province: DataTypes.STRING,
    phone: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    rating: {
      type: DataTypes.DOUBLE,
      defaultValue: 5
    },
    open_time: DataTypes.TIME,
    close_time: DataTypes.TIME,
    status: DataTypes.STRING,
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'court_groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return CourtGroup;
};
```

## Testing

### Test với cURL

```bash
# Lấy 4 sân top rated
curl -X GET "http://localhost:8080/api/court-groups/top-rated?limit=4"

# Lấy 2 sân top rated
curl -X GET "http://localhost:8080/api/court-groups/top-rated?limit=2"
```

### Test với Postman

1. Method: `GET`
2. URL: `http://localhost:8080/api/court-groups/top-rated`
3. Query Params:
   - `limit`: `4`

## Lưu ý

1. **Rating**: Đảm bảo rating được tính toán và cập nhật đúng khi có review mới
2. **Status**: Chỉ hiển thị sân đã được duyệt (`approved`) hoặc chưa có status
3. **Images**: Xử lý trường hợp image là null hoặc rỗng
4. **Performance**: Có thể thêm index cho cột `rating` và `is_deleted` để tối ưu query
5. **Limit**: Giới hạn tối đa 4 sân để đảm bảo hiệu suất

## Index đề xuất

```sql
-- Tạo index để tối ưu query
CREATE INDEX idx_court_groups_rating ON court_groups(rating DESC);
CREATE INDEX idx_court_groups_status ON court_groups(status, is_deleted);
```



