# API: Quản lý yêu thích sân

## 1. Thêm sân vào yêu thích
```
POST /api/favorites/{courtGroupId}
```
**Response:**
```json
{
  "message": "Đã thêm vào yêu thích"
}
```

## 2. Xóa sân khỏi yêu thích
```
DELETE /api/favorites/{courtGroupId}
```
**Response:**
```json
{
  "message": "Đã xóa khỏi yêu thích"
}
```

## 3. Kiểm tra sân có trong yêu thích
```
GET /api/favorites/check/{courtGroupId}
```
**Response:**
```json
{
  "result": true,
  "isFavorite": true
}
```

## 4. Lấy danh sách sân yêu thích
```
GET /api/favorites
```
**Response:**
```json
{
  "result": [
    {
      "_id": "32",
      "name": "Sân Thành Công",
      "type": "Football",
      ...
    }
  ]
}
```

## Database Schema
```sql
CREATE TABLE `favorites` (
  `user_id` bigint NOT NULL,
  `court_group_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `court_group_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  FOREIGN KEY (`court_group_id`) REFERENCES `court_groups` (`id`)
);
```

## Spring Boot Implementation

### Entity
```java
@Entity
@Table(name = "favorites")
@IdClass(FavoriteId.class)
public class Favorite {
    @Id
    @Column(name = "user_id")
    private Long userId;
    
    @Id
    @Column(name = "court_group_id")
    private Long courtGroupId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

### Repository
```java
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, FavoriteId> {
    boolean existsByUserIdAndCourtGroupId(Long userId, Long courtGroupId);
    void deleteByUserIdAndCourtGroupId(Long userId, Long courtGroupId);
    List<Favorite> findByUserId(Long userId);
}
```

### Service
```java
@Service
public class FavoriteService {
    @Autowired
    private FavoriteRepository favoriteRepository;
    
    @Autowired
    private CourtGroupRepository courtGroupRepository;
    
    public void addFavorite(Long userId, Long courtGroupId) {
        if (!favoriteRepository.existsByUserIdAndCourtGroupId(userId, courtGroupId)) {
            Favorite favorite = new Favorite();
            favorite.setUserId(userId);
            favorite.setCourtGroupId(courtGroupId);
            favorite.setCreatedAt(LocalDateTime.now());
            favoriteRepository.save(favorite);
        }
    }
    
    public void removeFavorite(Long userId, Long courtGroupId) {
        favoriteRepository.deleteByUserIdAndCourtGroupId(userId, courtGroupId);
    }
    
    public boolean isFavorite(Long userId, Long courtGroupId) {
        return favoriteRepository.existsByUserIdAndCourtGroupId(userId, courtGroupId);
    }
    
    public List<CourtGroup> getFavoriteCourts(Long userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        return favorites.stream()
            .map(f -> courtGroupRepository.findById(f.getCourtGroupId()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
    }
}
```

### Controller
```java
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;
    
    @PostMapping("/{courtGroupId}")
    public ResponseEntity<Map<String, String>> addFavorite(
            @PathVariable Long courtGroupId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        favoriteService.addFavorite(userId, courtGroupId);
        return ResponseEntity.ok(Map.of("message", "Đã thêm vào yêu thích"));
    }
    
    @DeleteMapping("/{courtGroupId}")
    public ResponseEntity<Map<String, String>> removeFavorite(
            @PathVariable Long courtGroupId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        favoriteService.removeFavorite(userId, courtGroupId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa khỏi yêu thích"));
    }
    
    @GetMapping("/check/{courtGroupId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @PathVariable Long courtGroupId,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        boolean isFavorite = favoriteService.isFavorite(userId, courtGroupId);
        return ResponseEntity.ok(Map.of("result", isFavorite, "isFavorite", isFavorite));
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getFavorites(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        List<CourtGroup> courts = favoriteService.getFavoriteCourts(userId);
        return ResponseEntity.ok(Map.of("result", courts));
    }
}
```

**Lưu ý:** 
- Tất cả endpoints cần authentication (JWT token)
- Kiểm tra `court_group_id` tồn tại trước khi thêm favorite
- Trả về 404 nếu court không tồn tại

