# API: Lấy giá và khung giờ sân

## Endpoint
```
GET /api/court-groups/{courtGroupId}/prices
```

## Response
```json
{
  "result": [
    {
      "id": 391,
      "timeSlotId": 1,
      "startTime": "05:00:00",
      "endTime": "17:30:00",
      "dayType": "WEEKDAY",
      "price": 25000.0
    }
  ]
}
```

## SQL Query
```sql
SELECT 
    cp.id,
    cp.time_slot_id AS timeSlotId,
    ts.start_time AS startTime,
    ts.end_time AS endTime,
    cp.day_type AS dayType,
    cp.price
FROM court_prices cp
INNER JOIN time_slots ts ON cp.time_slot_id = ts.id
WHERE cp.court_group_id = :courtGroupId
ORDER BY cp.day_type, ts.start_time
```

## Spring Boot Controller
```java
@GetMapping("/{courtGroupId}/prices")
public ResponseEntity<Map<String, Object>> getCourtPrices(@PathVariable Long courtGroupId) {
    List<CourtPriceDTO> prices = courtPriceService.getCourtPrices(courtGroupId);
    return ResponseEntity.ok(Map.of("result", prices));
}
```

## DTO
```java
public class CourtPriceDTO {
    private Long id;
    private Long timeSlotId;
    private String startTime;
    private String endTime;
    private String dayType; // "WEEKDAY" or "WEEKEND"
    private Double price;
}
```

**Lưu ý:** Nếu không có giá, trả về `[]`.

