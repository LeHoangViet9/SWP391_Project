# Spec: Customer Feedback (Đánh giá khách hàng)

## Objective
Tính năng **Customer Feedback** cho phép khách hàng gửi phản hồi và đánh giá sau khi kết thúc kỳ lưu trú tại khách sạn. Mục tiêu là giúp ban quản lý nhận biết mức độ hài lòng của khách hàng và cải thiện chất lượng dịch vụ, đồng thời phản hồi trực tiếp các ý kiến đóng góp.

### Quy trình nghiệp vụ:
1. **Khách hàng**: Sau khi trả phòng (`CHECKED_OUT`), khách hàng có thể viết đánh giá cho đơn đặt phòng đó.
2. **Nội dung đánh giá**: Số sao (1 đến 5), phân loại (Phòng nghỉ, Dịch vụ, Sạch sẽ, Nhân viên) và bình luận (tối đa 255 ký tự).
3. **Quản trị viên / Nhân viên**: Xem danh sách đánh giá, lọc theo rating, tìm kiếm từ khóa, gửi phản hồi và xóa đánh giá.

---

## Tech Stack
* **Backend**: Spring Boot, Spring Data JPA, PostgreSQL, Spring Security.
* **Frontend**: React (Vite), TailwindCSS, Lucide React (Icons).

---

## Database Schema

Bảng cơ sở dữ liệu `customer_feedback` được định nghĩa cụ thể với cấu trúc cột, kiểu dữ liệu, ràng buộc ngoại khóa và các chỉ mục (indexes) như sau:

### 1. Cấu trúc bảng `customer_feedback`

| Tên cột | Kiểu dữ liệu | Nullable | Ràng buộc | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `feedback_id` | `BIGSERIAL` | NO | `PRIMARY KEY` | ID tự tăng của đánh giá |
| `booking_id` | `BIGINT` | NO | `FOREIGN KEY` references `bookings(id)` | ID của đơn đặt phòng được đánh giá |
| `customer_id` | `BIGINT` | NO | `FOREIGN KEY` references `customers(id)` | ID của khách hàng viết đánh giá |
| `rating` | `INT` | NO | `CHECK (rating >= 1 AND rating <= 5)` | Số sao đánh giá từ 1 đến 5 |
| `category` | `VARCHAR(50)`| NO | `CHECK (category IN ('Room', 'Service', 'Cleanliness', 'Staff'))` | Phân loại khía cạnh đánh giá (chọn 1) |
| `comment` | `VARCHAR(255)`| NO| | Nội dung đánh giá (tối đa 255 ký tự) |
| `status` | `VARCHAR(50)`| NO | `DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved'))` | Trạng thái phản hồi của đánh giá |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Thời gian tạo đánh giá |
| `reply` | `TEXT` | YES | | Nội dung phản hồi từ quản lý |

### 2. Định nghĩa Indexes
* **`idx_feedback_booking_id`**: Tạo trên cột `booking_id` nhằm tăng tốc độ truy vấn kiểm tra trùng lặp (mỗi booking chỉ được đánh giá 1 lần).
* **`idx_feedback_customer_id`**: Tạo trên cột `customer_id` phục vụ việc truy vấn lịch sử đánh giá của khách hàng.
* **`idx_feedback_rating`**: Tạo trên cột `rating` phục vụ chức năng lọc nhanh theo số sao.
* **`idx_feedback_created_at`**: Tạo trên cột `created_at DESC` phục vụ việc sắp xếp phân trang theo thời gian mới nhất.

---

## Category Standardization (Chuẩn hóa Phân loại)
Phân loại đánh giá được giới hạn bằng kiểu dữ liệu chuỗi (`VARCHAR(50)`) với ràng buộc CHECK để tối ưu hóa lưu trữ và khả năng kiểm tra tính toàn vẹn dữ liệu.
* **Hình thức**: Chọn duy nhất một phân loại (Single-select).
* **Các giá trị chuẩn hóa (lưu trữ trong DB)**:
  * `'Room'`: Phòng nghỉ
  * `'Service'`: Dịch vụ
  * `'Cleanliness'`: Sạch sẽ
  * `'Staff'`: Nhân viên

---

## Roles & Permissions Mapping (Phân quyền chi tiết)

Bảng phân quyền chi tiết cho tính năng feedback đối với các Role trong hệ thống:

| Quyền hạn (Authority) | Mô tả hành động | CUSTOMER (Khách) | RECEPTIONIST (Lễ tân) | MANAGER (Quản lý) | ADMIN (Quản trị) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `FEEDBACK_CREATE` | Viết đánh giá mới cho booking của mình | **Có** | Không | Không | Kế thừa |
| `FEEDBACK_VIEW` | Xem danh sách & tìm kiếm đánh giá | Không | **Có** | **Có** | Kế thừa |
| `FEEDBACK_UPDATE` | Phản hồi (Reply) ý kiến khách hàng | Không | Không | **Có** | Kế thừa |
| `FEEDBACK_DELETE` | Xóa đánh giá không chuẩn mực | Không | Không | **Có** | Kế thừa |

*Ghi chú: ADMIN trong hệ thống HMS Luxury được cấu hình tự động có toàn bộ quyền hạn (Full Access).*

---

## API Contract (Hợp đồng API)

Hệ thống cung cấp các REST API endpoints sau dưới dạng JSON định dạng chuẩn:

### 1. Tạo đánh giá mới (`POST /api/v1/feedbacks`)
* **Mô tả**: Khách hàng gửi đánh giá cho booking của mình đã check-out.
* **Quyền**: `FEEDBACK_CREATE`
* **Request Body (`application/json`)**:
```json
{
  "bookingId": 12,
  "rating": 5,
  "category": "Room",
  "comment": "Phòng Suite view biển rất đẹp, thiết bị hiện đại!"
}
```
* **Response Body (`201 Created`)**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": 1,
    "bookingId": 12,
    "customerName": "Nguyễn Văn A",
    "roomTypeName": "Deluxe Ocean View",
    "rating": 5,
    "category": "Room",
    "comment": "Phòng Suite view biển rất đẹp, thiết bị hiện đại!",
    "status": "pending",
    "createdAt": "2026-06-23T12:00:00",
    "reply": null
  },
  "status": "CREATED"
}
```

### 2. Tìm kiếm và Lọc đánh giá (`GET /api/v1/feedbacks`)
* **Mô tả**: Quản lý / Lễ tân xem và lọc danh sách đánh giá.
* **Quyền**: `FEEDBACK_VIEW`
* **Request Query Parameters**:
  * `keyword` (String, optional): Tìm kiếm theo tên khách hàng hoặc nội dung bình luận.
  * `rating` (Integer, optional): Lọc theo số sao đánh giá (1-5).
  * `page` (Integer, default = 0): Vị trí trang.
  * `size` (Integer, default = 10): Số lượng phần tử mỗi trang.
* **Response Body (`200 OK`)**:
```json
{
  "success": true,
  "message": "Feedbacks retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "bookingId": 12,
        "customerName": "Nguyễn Văn A",
        "roomTypeName": "Deluxe Ocean View",
        "rating": 5,
        "category": "Room",
        "comment": "Phòng Suite view biển rất đẹp, thiết bị hiện đại!",
        "status": "pending",
        "createdAt": "2026-06-23T12:00:00",
        "reply": null
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10
    },
    "totalPages": 1,
    "totalElements": 1,
    "size": 10,
    "number": 0
  },
  "status": "OK"
}
```

### 3. Phản hồi đánh giá (`PUT /api/v1/feedbacks/{id}/reply`)
* **Mô tả**: Quản lý gửi phản hồi cho đánh giá của khách hàng.
* **Quyền**: `FEEDBACK_UPDATE`
* **Request Body (`application/json`)**:
```json
{
  "reply": "Cảm ơn anh A đã ủng hộ HMS Luxury. Rất mong được đón tiếp anh lần sau!"
}
```
* **Response Body (`200 OK`)**:
```json
{
  "success": true,
  "message": "Feedback replied successfully",
  "data": {
    "id": 1,
    "bookingId": 12,
    "customerName": "Nguyễn Văn A",
    "roomTypeName": "Deluxe Ocean View",
    "rating": 5,
    "category": "Room",
    "comment": "Phòng Suite view biển rất đẹp, thiết bị hiện đại!",
    "status": "reviewed",
    "createdAt": "2026-06-23T12:00:00",
    "reply": "Cảm ơn anh A đã ủng hộ HMS Luxury. Rất mong được đón tiếp anh lần sau!"
  },
  "status": "OK"
}
```

### 4. Xóa đánh giá (`DELETE /api/v1/feedbacks/{id}`)
* **Mô tả**: Quản trị viên xóa đánh giá không phù hợp.
* **Quyền**: `FEEDBACK_DELETE`
* **Response Body (`200 OK`)**:
```json
{
  "success": true,
  "message": "Feedback deleted successfully",
  "status": "OK"
}
```

---

## Commands
* **Build & Compile Backend**:
  ```bash
  ./gradlew compileJava
  ```
* **Run Backend**:
  ```bash
  ./gradlew bootRun
  ```
* **Build Frontend**:
  ```bash
  cmd.exe /c "npm run build"
  ```
* **Run Frontend Dev Server**:
  ```bash
  cmd.exe /c "npm run dev"
  ```

---

## Project Structure
```
SWP391_Project/
├── src/main/java/com/hms/
│   ├── entity/customer/CustomerFeedback.java            # Khai báo bảng CSDL và ràng buộc dữ liệu
│   ├── repository/customer/CustomerFeedbackRepository.java # Truy vấn CSDL (phân trang, tìm kiếm)
│   ├── dto/customer/
│   │   ├── request/CustomerFeedbackRequest.java        # Định nghĩa dữ liệu gửi đánh giá từ Khách hàng
│   │   ├── request/FeedbackReplyRequest.java           # Định nghĩa dữ liệu gửi phản hồi từ Quản trị viên
│   │   └── response/CustomerFeedbackResponse.java      # Định nghĩa dữ liệu trả về Frontend
│   ├── service/customer/
│   │   ├── CustomerFeedbackService.java                # Interface xử lý logic nghiệp vụ
│   │   └── impl/CustomerFeedbackServiceImpl.java       # Triển khai logic nghiệp vụ
│   └── controller/customer/CustomerFeedbackController.java # Cung cấp REST endpoints bảo mật
├── frontend/src/
│   ├── services/feedbackService.js                     # Gọi API client gửi/nhận dữ liệu đánh giá
│   └── components/
│       ├── FeedbackManager.jsx                         # Giao diện Quản trị viên (Xem thống kê, trả lời, xóa)
│       └── CustomerBookingHistory.jsx                  # Giao diện Khách hàng (Lịch sử đặt phòng kèm Modal đánh giá)
```

---

## Testing Strategy
* **Backend API Integration Test**: Kiểm tra luồng gọi API thông qua Postman hoặc MockMvc.
* **Quy trình xác thực**:
  1. Gửi đánh giá cho phòng chưa trả phòng hoặc không thuộc về tài khoản khách hàng &rarr; Kỳ vọng trả về lỗi `400 Bad Request` hoặc `403 Forbidden`.
  2. Gửi đánh giá hợp lệ &rarr; Kỳ vọng trả về mã `201 Created` và lưu thông tin vào DB.
  3. Gửi đánh giá lần thứ 2 cho cùng một đơn đặt phòng &rarr; Kỳ vọng trả về lỗi trùng lặp `409 Conflict`.

---

## Boundaries
* **Always**:
  * Kiểm tra quyền hạn người dùng trước khi thực thi bất kỳ thao tác nghiệp vụ nào.
  * Validate giới hạn điểm số đánh giá từ 1 đến 5 và bình luận không vượt quá 255 ký tự.
* **Ask first**:
  * Thay đổi cấu trúc cơ sở dữ liệu của bảng `customer_feedback`.
* **Never**:
  * Cho phép khách hàng chỉnh sửa hoặc xóa đánh giá của khách hàng khác.
  * Cho phép phản hồi đánh giá khi chưa đăng nhập quyền quản trị/nhân viên.

---

## Success Criteria (Tiêu chí thành công)
- [x] Khách hàng chỉ có thể đánh giá những phòng có trạng thái đã trả phòng (`CHECKED_OUT`).
- [x] Nút "Đánh giá" hiển thị nhấp nháy (pulsing) trực quan để kích thích khách hàng phản hồi.
- [x] Điểm rating bị giới hạn chặt chẽ từ 1 đến 5 sao.
- [x] Chiều dài bình luận giới hạn tối đa 255 ký tự cả trên UI lẫn Database.
- [x] Mỗi đơn đặt phòng chỉ có tối đa 1 đánh giá (không cho phép spam).
- [x] Quản trị viên/Nhân viên có quyền cập nhật phản hồi (reply) và xóa các đánh giá không chuẩn mực.
- [x] Đồng bộ dữ liệu CSDL thông qua file cấu hình SQL (`Query.sql`).
- [x] Dự án tự động biên dịch và build thành công không lỗi ở cả Backend và Frontend.
