# API: Tìm kiếm và lọc sân

## Endpoint
```
GET /api/courts/search
```

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | String | No | Loại sân (Badminton, Football, Tennis, Basketball) |
| `city` | String | No | Tỉnh/Thành phố |
| `district` | String | No | Quận/Huyện |
| `search` | String | No | Tìm kiếm theo tên, địa chỉ, mô tả |
| `minPrice` | Number | No | Giá tối thiểu (VNĐ/giờ) |
| `maxPrice` | Number | No | Giá tối đa (VNĐ/giờ) |
| `minRating` | Number | No | Đánh giá tối thiểu (0-5) |

## Response Format
```json
{
  "result": [
    {
      "_id": "32",
      "name": "Sân Thành Công",
      "type": "Football",
      "address": "120 Giải Phóng",
      "district": "Hoàng Mai",
      "province": "Hà Nội",
      "phone": "0985456870",
      "rating": 4.0,
      "openTime": "07:00:00",
      "closeTime": "23:30:00",
      "images": ["image1.jpg", "image2.jpg"],
      "description": "sân đẹp, giá tốt"
    }
  ]
}
```

## SQL Query Example
```sql
SELECT DISTINCT
    cg.id AS _id,
    cg.name,
    cg.type,
    cg.address,
    cg.district,
    cg.province,
    cg.phone,
    cg.rating,
    cg.open_time AS openTime,
    cg.close_time AS closeTime,
    cg.image AS images,
    cg.description
FROM court_groups cg
LEFT JOIN court_prices cp ON cg.id = cp.court_group_id
WHERE cg.is_deleted = 0
    AND cg.status = 'approved'
    AND (:type IS NULL OR cg.type = :type)
    AND (:city IS NULL OR cg.province = :city)
    AND (:district IS NULL OR cg.district = :district)
    AND (:search IS NULL OR 
         cg.name LIKE CONCAT('%', :search, '%') OR
         cg.address LIKE CONCAT('%', :search, '%') OR
         cg.description LIKE CONCAT('%', :search, '%'))
    AND (:minPrice IS NULL OR 
         EXISTS (SELECT 1 FROM court_prices 
                 WHERE court_group_id = cg.id AND price >= :minPrice))
    AND (:maxPrice IS NULL OR 
         EXISTS (SELECT 1 FROM court_prices 
                 WHERE court_group_id = cg.id AND price <= :maxPrice))
    AND (:minRating IS NULL OR cg.rating >= :minRating)
ORDER BY cg.rating DESC, cg.name ASC
```

## Spring Boot Implementation

### DTO
```java
public class SearchRequest {
    private String type;
    private String city;
    private String district;
    private String search;
    private Double minPrice;
    private Double maxPrice;
    private Double minRating;
    // getters, setters
}
```

### Repository
```java
@Repository
public interface CourtGroupRepository extends JpaRepository<CourtGroup, Long> {
    @Query("SELECT DISTINCT cg FROM CourtGroup cg " +
           "LEFT JOIN CourtPrice cp ON cg.id = cp.courtGroup.id " +
           "WHERE cg.isDeleted = false " +
           "AND cg.status = 'approved' " +
           "AND (:type IS NULL OR cg.type = :type) " +
           "AND (:city IS NULL OR cg.province = :city) " +
           "AND (:district IS NULL OR cg.district = :district) " +
           "AND (:search IS NULL OR " +
           "     LOWER(cg.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(cg.address) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(cg.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:minPrice IS NULL OR EXISTS " +
           "     (SELECT 1 FROM CourtPrice cp2 WHERE cp2.courtGroup.id = cg.id AND cp2.price >= :minPrice)) " +
           "AND (:maxPrice IS NULL OR EXISTS " +
           "     (SELECT 1 FROM CourtPrice cp3 WHERE cp3.courtGroup.id = cg.id AND cp3.price <= :maxPrice)) " +
           "AND (:minRating IS NULL OR cg.rating >= :minRating) " +
           "ORDER BY cg.rating DESC, cg.name ASC")
    List<CourtGroup> searchCourts(
        @Param("type") String type,
        @Param("city") String city,
        @Param("district") String district,
        @Param("search") String search,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("minRating") Double minRating
    );
}
```

### Service
```java
@Service
public class CourtGroupService {
    @Autowired
    private CourtGroupRepository courtGroupRepository;
    
    public List<CourtGroupDTO> searchCourts(SearchRequest request) {
        List<CourtGroup> courts = courtGroupRepository.searchCourts(
            request.getType(),
            request.getCity(),
            request.getDistrict(),
            request.getSearch(),
            request.getMinPrice(),
            request.getMaxPrice(),
            request.getMinRating()
        );
        return courts.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }
}
```

### Controller
```java
@RestController
@RequestMapping("/api/courts")
public class CourtController {
    @Autowired
    private CourtGroupService courtGroupService;
    
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchCourts(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating) {
        
        SearchRequest request = new SearchRequest();
        request.setType(type);
        request.setCity(city);
        request.setDistrict(district);
        request.setSearch(search);
        request.setMinPrice(minPrice);
        request.setMaxPrice(maxPrice);
        request.setMinRating(minRating);
        
        List<CourtGroupDTO> results = courtGroupService.searchCourts(request);
        return ResponseEntity.ok(Map.of("result", results));
    }
}
```

## Lưu ý
- Tất cả parameters đều optional
- `search` tìm kiếm trong: name, address, description (case-insensitive)
- `minPrice` và `maxPrice` kiểm tra trong bảng `court_prices`
- `minRating` so sánh với `rating` trong `court_groups`
- Chỉ trả về sân có `status = 'approved'` và `is_deleted = 0`
- Sắp xếp theo rating giảm dần, sau đó theo tên tăng dần


