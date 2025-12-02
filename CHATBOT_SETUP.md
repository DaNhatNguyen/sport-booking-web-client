## Tích hợp Chatbot hỗ trợ khách hàng (Frontend React + Backend Spring Boot + Gemini)

### 1. Mục tiêu chức năng

- **Hỏi/đáp tự nhiên** về:
  - **Giờ mở/đóng cửa** của sân (`court_groups.open_time`, `close_time`).
  - **Giá sân theo khung giờ / ngày trong tuần** (`court_prices`, `time_slots`, `court_groups`).
  - **Hướng dẫn cách thanh toán** (nội dung tĩnh + LLM diễn giải).
  - **Kiểm tra trạng thái thanh toán/lượt đặt** (`bookings.status`, `payment_proof`).
  - **Hướng dẫn đặt sân / đặt lịch cố định** (`bookings`, `fixed_bookings`).
- Giao diện **widget chat nổi** ở góc màn hình trong `HomePage.tsx`.
- Backend Spring Boot sẽ:
  - Nhận câu hỏi từ frontend.
  - Gọi LLM (Gemini) để **hiểu ý định**.
  - Khi cần, truy vấn database MySQL (schema như bạn gửi).
  - Tổng hợp câu trả lời gửi lại cho frontend.

---

### 2. Thiết kế API backend (Spring Boot)

#### 2.1. Endpoint đề xuất

- **URL**: `POST /api/chatbot/query`
- **Request body (JSON)**:

```json
{
  "message": "Cho mình hỏi giờ mở cửa sân Thành Công ở Giải Phóng?",
  "conversationId": "optional-id-or-null",
  "history": [
    {
      "role": "user",
      "content": "Câu hỏi trước đó (nếu có)"
    },
    {
      "role": "assistant",
      "content": "Trả lời trước đó (nếu có)"
    }
  ],
  "userContext": {
    "userId": 8,
    "preferredDistrict": "Hoàng Mai"
  }
}
```

- **Response body (JSON)**:

```json
{
  "answer": "Sân Thành Công tại 120 Giải Phóng mở cửa từ 07:00 đến 23:30 mỗi ngày.",
  "metadata": {
    "intent": "CHECK_OPENING_HOURS",
    "sources": [
      "court_groups.id=32"
    ]
  }
}
```

> Gợi ý: Bạn có thể thêm các field như `followUpQuestions`, `rawGeminiResponse` nếu muốn debug.

#### 2.2. DTO mẫu (Java)

```java
// ChatbotRequest.java
public class ChatbotRequest {
    private String message;
    private String conversationId;
    private List<Message> history;
    private UserContext userContext;
    // getters/setters

    public static class Message {
        private String role;    // "user" | "assistant"
        private String content;
        // getters/setters
    }

    public static class UserContext {
        private Long userId;
        private String preferredDistrict;
        // getters/setters
    }
}

// ChatbotResponse.java
public class ChatbotResponse {
    private String answer;
    private Metadata metadata;
    // getters/setters

    public static class Metadata {
        private String intent;
        private List<String> sources;
        // getters/setters
    }
}
```

#### 2.3. Controller mẫu

```java
@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/query")
    public ResponseEntity<ChatbotResponse> query(@RequestBody ChatbotRequest request,
                                                 @AuthenticationPrincipal JwtAuthenticationToken auth) {
        // Nếu bạn dùng JWT, có thể lấy userId ở đây
        // Long userId = ...;
        ChatbotResponse response = chatbotService.handleRequest(request);
        return ResponseEntity.ok(response);
    }
}
```

---

### 3. Tích hợp Gemini trong Spring Boot (gợi ý)

Bạn có thể dùng **Google AI Studio / Vertex AI** với REST API. Ví dụ pseudo-code với HTTP client:

#### 3.1. Cấu hình

- Tạo biến môi trường / cấu hình:
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL_NAME` (ví dụ: `gemini-1.5-flash`).

```java
@Configuration
@ConfigurationProperties(prefix = "gemini")
public class GeminiProperties {
    private String apiKey;
    private String model; // "gemini-1.5-flash"
    // getters/setters
}
```

#### 3.2. Service chính

```java
@Service
public class ChatbotService {

    private final GeminiClient geminiClient;
    private final CourtRepository courtRepository;
    private final CourtPriceRepository courtPriceRepository;
    private final BookingRepository bookingRepository;

    public ChatbotService(GeminiClient geminiClient,
                          CourtRepository courtRepository,
                          CourtPriceRepository courtPriceRepository,
                          BookingRepository bookingRepository) {
        this.geminiClient = geminiClient;
        this.courtRepository = courtRepository;
        this.courtPriceRepository = courtPriceRepository;
        this.bookingRepository = bookingRepository;
    }

    public ChatbotResponse handleRequest(ChatbotRequest req) {
        // 1. Gửi message + history sang Gemini để LLM đoán intent + entity
        GeminiResult nlu = geminiClient.detectIntent(req);

        // 2. Tùy intent, truy vấn DB và build answer
        switch (nlu.intent()) {
            case "CHECK_OPENING_HOURS":
                return handleOpeningHours(nlu, req);
            case "CHECK_PRICE":
                return handlePriceQuery(nlu, req);
            case "CHECK_BOOKING_STATUS":
                return handleBookingStatus(nlu, req);
            case "HOW_TO_BOOK":
            case "HOW_TO_PAY":
                return handleGuide(nlu, req);
            default:
                return fallbackSmallTalk(nlu, req);
        }
    }

    private ChatbotResponse handleOpeningHours(GeminiResult nlu, ChatbotRequest req) {
        // Ví dụ: nlu đã extract được tên sân / địa chỉ / district
        String courtName = nlu.getEntity("court_group_name");

        Optional<CourtGroup> cg = courtRepository
                .findTopByNameContainingIgnoreCaseAndIsDeletedFalse(courtName);

        if (cg.isEmpty()) {
            return simpleAnswer("Mình chưa tìm thấy sân phù hợp, bạn có thể cung cấp tên đầy đủ hơn không?",
                    "CHECK_OPENING_HOURS", List.of());
        }

        CourtGroup group = cg.get();
        String msg = String.format(
                "Sân %s tại %s mở cửa từ %s đến %s.",
                group.getName(), group.getAddress(),
                group.getOpenTime(), group.getCloseTime()
        );

        return simpleAnswer(msg, "CHECK_OPENING_HOURS",
                List.of("court_groups.id=" + group.getId()));
    }

    private ChatbotResponse simpleAnswer(String text, String intent, List<String> sources) {
        ChatbotResponse resp = new ChatbotResponse();
        resp.setAnswer(text);
        ChatbotResponse.Metadata m = new ChatbotResponse.Metadata();
        m.setIntent(intent);
        m.setSources(sources);
        resp.setMetadata(m);
        return resp;
    }
}
```

> `GeminiClient` sẽ là class bạn tự viết để gọi HTTP tới API Gemini, truyền prompt + messages + system instructions.

#### 3.3. Gợi ý prompt cho Gemini

- **System prompt** (ví dụ):

> "Bạn là chatbot hỗ trợ khách hàng cho hệ thống đặt sân thể thao. Bạn không trực tiếp truy cập database mà chỉ gọi lại cho backend các intent sau: CHECK_OPENING_HOURS, CHECK_PRICE, CHECK_BOOKING_STATUS, HOW_TO_BOOK, HOW_TO_PAY. Khi người dùng hỏi, hãy trích ra intent, các entity quan trọng (tên sân, ngày, giờ, quận/huyện, mã đặt chỗ...), và trả về ở dạng JSON cho backend."

- Sau khi Gemini trả về JSON (intent + entity), backend quyết định query DB và build câu trả lời tiếng Việt thân thiện.

---

### 4. Truy vấn DB theo intent (gợi ý SQL)

- **Giờ mở/đóng cửa sân**:

```sql
SELECT name, address, open_time, close_time
FROM court_groups
WHERE is_deleted = 0
  AND status = 'approved'
  AND name LIKE CONCAT('%', :courtName, '%')
LIMIT 5;
```

- **Giá sân theo khung giờ / ngày trong tuần**:

```sql
SELECT cg.name,
       cp.day_type,
       ts.start_time,
       ts.end_time,
       cp.price
FROM court_prices cp
JOIN court_groups cg ON cg.id = cp.court_group_id
JOIN time_slots ts ON ts.id = cp.time_slot_id
WHERE cg.is_deleted = 0
  AND cg.status = 'approved'
  AND cg.name LIKE CONCAT('%', :courtName, '%')
  AND cp.day_type = :dayType; -- WEEKDAY / WEEKEND
```

- **Kiểm tra trạng thái thanh toán / lượt đặt**:

```sql
SELECT b.id,
       b.status,
       b.booking_date,
       b.start_time,
       b.end_time,
       b.payment_proof
FROM bookings b
WHERE b.id = :bookingId
  AND (:userId IS NULL OR b.user_id = :userId);
```

Backend sẽ convert các kết quả này thành câu trả lời tiếng Việt gửi cho frontend.

---

### 5. Tích hợp Frontend (React – file `HomePage.tsx`)

#### 5.1. Component widget chat

- Đã tạo component `ChatbotWidget.tsx` trong `src/components`.
- Component này:
  - Hiển thị **nút tròn nổi** ở góc dưới bên phải.
  - Khi click: mở **hộp chat** (Panel) với:
    - Danh sách tin nhắn (user / bot).
    - Ô nhập text + nút gửi.
  - Gọi API: `POST {REACT_APP_API_URL}/chatbot/query`.

#### 5.2. Props & API call ở frontend

- Endpoint sẽ được gọi bằng `axios`:

```ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

await axios.post(
  `${API_BASE}/chatbot/query`,
  {
    message: input,
    history: mappedHistory,
    userContext: { userId: storedUser?.id }
  },
  {
    headers: storedUser?.token
      ? { Authorization: storedUser.token }
      : {}
  }
);
```

- Frontend chỉ **hiển thị `response.data.answer`** từ backend.

#### 5.3. Sử dụng trong `HomePage.tsx`

- Trong React component `HomePage`, chỉ cần:

```tsx
import ChatbotWidget from '../components/ChatbotWidget';

// ...
<>
  {/* nội dung hiện tại */}
  <ChatbotWidget />
</>
```

---

### 6. Các bước thực hiện tổng quan

1. **Backend**
   - Tạo DTO: `ChatbotRequest`, `ChatbotResponse`.
   - Tạo `ChatbotController` với endpoint `POST /api/chatbot/query`.
   - Tạo `ChatbotService`:
     - Gọi Gemini để detect intent + entity.
     - Tùy intent, truy vấn DB (`court_groups`, `court_prices`, `time_slots`, `bookings`, `fixed_bookings`...).
     - Build câu trả lời tiếng Việt thân thiện trong field `answer`.
   - Cài đặt `GeminiClient` gọi API Gemini bằng API key.
2. **Frontend**
   - Cấu hình biến môi trường `REACT_APP_API_URL` trỏ tới backend Spring Boot.
   - Đảm bảo đã có `axios` và Mantine (đang dùng rồi).
   - Thêm file `ChatbotWidget.tsx` (đã được tạo trong repo).
   - Import và thêm `<ChatbotWidget />` vào `HomePage.tsx`.
3. **Kiểm thử**
   - Chạy backend + frontend.
   - Mở trang chủ, click icon chatbot, thử các câu hỏi:
     - "Giờ mở cửa sân Thành Công ở 120 Giải Phóng?"
     - "Giá sân cầu lông Đức Thảo buổi tối thứ 7 là bao nhiêu?"
     - "Kiểm tra giúp mình trạng thái thanh toán booking 91."
     - "Hướng dẫn mình cách đặt sân cố định hàng tuần."

Khi bạn hoàn thành phần backend (controller + service + GeminiClient), chatbot trên frontend sẽ hoạt động dựa trên API mà bạn triển khai.


