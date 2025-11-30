# Hướng dẫn API Backend - Quản lý Thông tin Cá nhân

## Tổng quan

Tài liệu này hướng dẫn implement các API cho tính năng quản lý thông tin cá nhân trên Spring Boot:

1. Cập nhật thông tin người dùng (bao gồm upload avatar)
2. Lấy thông tin người dùng hiện tại

---

## 1. API Cập nhật Thông tin Người dùng

### Endpoint

```
PUT /api/users/profile
```

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data (nếu có ảnh) hoặc application/json
```

### Request Body

#### Option 1: Cập nhật không có ảnh (JSON)

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0987654321"
}
```

#### Option 2: Cập nhật có ảnh (FormData)

```
fullName: "Nguyễn Văn A"
phone: "0987654321"
avatar: [File]
```

### Response Format

#### Success (200 OK)

```json
{
  "success": true,
  "result": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0987654321",
    "role": "USER",
    "avatar": "abc123-avatar.jpg"
  },
  "message": "Cập nhật thông tin thành công"
}
```

**Lưu ý:**

- Nếu upload ảnh, `avatar` sẽ chứa tên file đã được lưu trên server
- URL ảnh sẽ là: `{API_BASE}/files/avatars/{avatar}`

#### Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ"
}
```

---

## 2. API Lấy Thông tin Người dùng Hiện tại

### Endpoint

```
GET /api/auth/myInfo
```

### Headers

```
Authorization: Bearer <token>
```

### Response Format

#### Success (200 OK)

```json
{
  "success": true,
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0987654321",
    "phoneNumber": "0987654321",
    "role": "USER",
    "avatar": "abc123-avatar.jpg"
  }
}
```

---

## Implementation - Spring Boot

### 1. Dependencies (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

### 2. Entity - User

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true)
    private String email;

    private String phone;
    private String password;
    private String role;
    private String avatar;

    // Getters and Setters
}
```

### 3. DTO - UpdateProfileRequest

```java
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    
    // Getters and Setters
}
```

### 4. Service - UserService

```java
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${file.upload-dir:uploads/avatars}")
    private String uploadDir;
    
    public User updateProfile(Long userId, UpdateProfileRequest request, MultipartFile avatarFile) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update basic info
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        
        // Handle avatar upload
        if (avatarFile != null && !avatarFile.isEmpty()) {
            // Delete old avatar if exists
            if (user.getAvatar() != null) {
                deleteFile(user.getAvatar());
            }
            
            // Save new avatar
            String fileName = saveFile(avatarFile);
            user.setAvatar(fileName);
        }
        
        return userRepository.save(user);
    }
    
    private String saveFile(MultipartFile file) {
        try {
            // Create upload directory if not exists
            File uploadPath = new File(uploadDir);
            if (!uploadPath.exists()) {
                uploadPath.mkdirs();
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = System.currentTimeMillis() + "-" + 
                             (int)(Math.random() * 1e9) + extension;
            
            // Save file
            File dest = new File(uploadPath, fileName);
            file.transferTo(dest);
            
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }
    }
    
    private void deleteFile(String fileName) {
        try {
            File file = new File(uploadDir, fileName);
            if (file.exists()) {
                file.delete();
            }
        } catch (Exception e) {
            // Log error but don't throw
        }
    }
}
```

### 5. Controller - UserController

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "avatar", required = false) MultipartFile avatarFile,
            Authentication authentication) {
        
        try {
            // Get user ID from JWT
            Long userId = getUserIdFromAuthentication(authentication);
            
            // Build request
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName(fullName);
            request.setPhone(phone);
            
            // Validate
            if (fullName == null || fullName.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Họ và tên không được để trống"));
            }
            
            // Update profile
            User updatedUser = userService.updateProfile(userId, request, avatarFile);
            
            // Build response
            Map<String, Object> result = Map.of(
                "id", updatedUser.getId(),
                "fullName", updatedUser.getFullName(),
                "email", updatedUser.getEmail(),
                "phone", updatedUser.getPhone() != null ? updatedUser.getPhone() : "",
                "role", updatedUser.getRole(),
                "avatar", updatedUser.getAvatar() != null ? updatedUser.getAvatar() : ""
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "result", result,
                "message", "Cập nhật thông tin thành công"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "Lỗi server khi cập nhật thông tin"));
        }
    }
    
    private Long getUserIdFromAuthentication(Authentication authentication) {
        // Implement logic to extract user ID from JWT token
        // Example: return ((UserDetails) authentication.getPrincipal()).getId();
        return 1L; // Placeholder
    }
}
```

### 6. Configuration - File Upload

```java
@Configuration
public class FileUploadConfig {
    
    @Bean
    public MultipartResolver multipartResolver() {
        CommonsMultipartResolver resolver = new CommonsMultipartResolver();
        resolver.setMaxUploadSize(5242880); // 5MB
        return resolver;
    }
}
```

### 7. Static Resource Configuration

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Value("${file.upload-dir:uploads/avatars}")
    private String uploadDir;
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/avatars/**")
            .addResourceLocations("file:" + uploadDir + "/");
    }
}
```

### 8. application.properties

```properties
# File upload
file.upload-dir=uploads/avatars
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=5MB
```

---

## Testing

### Test với cURL

```bash
# Cập nhật profile không có ảnh
curl -X PUT "http://localhost:8080/api/users/profile" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Nguyễn Văn A", "phone": "0987654321"}'

# Cập nhật profile có ảnh
curl -X PUT "http://localhost:8080/api/users/profile" \
  -H "Authorization: Bearer <token>" \
  -F "fullName=Nguyễn Văn A" \
  -F "phone=0987654321" \
  -F "avatar=@/path/to/image.jpg"

# Lấy thông tin user
curl -X GET "http://localhost:8080/api/auth/myInfo" \
  -H "Authorization: Bearer <token>"
```

---

## Lưu ý

1. **Authentication**: Tất cả API đều yêu cầu JWT token
2. **Validation**: Validate dữ liệu đầu vào (fullName không được rỗng, phone format, etc.)
3. **File Upload**: Giới hạn kích thước file 5MB, chỉ chấp nhận file ảnh
4. **Error Handling**: Xử lý lỗi đầy đủ và trả về message rõ ràng
5. **Security**: Đảm bảo chỉ user mới có thể cập nhật thông tin của chính họ
