# 🧾 Hướng Dẫn Chi Tiết Chuyên Sâu: Quản Lý Hóa Đơn, Thanh Toán & Check-out (Invoice, Billing & Checkout Management)

---

## I. TỔNG QUAN HỆ THỐNG & MÔ HÌNH THANH TOÁN (PAYMENT & BILLING MODEL)

Hệ thống Quản lý Khách sạn (HMS) thiết kế mô hình quản lý tài chính và hóa đơn dựa trên 3 quy trình cốt lõi:

```text
                  ┌────────────────────────────────────────────────────────┐
                  │ Khởi tạo Booking (Khách đặt phòng / Lễ tân tạo đơn)     │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │ Tạo Invoice tự động với PaymentStatus = PENDING        │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
         【Thanh toán Online / VietQR】                  【Thanh toán tại Quầy (Pay at Desk)】
                       │                                           │
                       ▼                                           ▼
      Sinh Mã QR động (VietQR Format)            Lễ tân nhận Tiền mặt / Thẻ ngân hàng
                       │                                           │
                       ▼                                           ▼
      Khách chuyển khoản thành công               Lễ tân gọi API /batch/pay-at-desk
                       │                                           │
                       ▼                                           ▼
Webhook / Simulate Callback tiếp nhận         Hệ thống ghi nhận PaymentDetail (CASH/CARD)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │  Invoice status ➔ PAID                                  │
                  │  Booking status ➔ CONFIRMED / Chờ Check-in             │
                  └────────────────────────────────────────────────────────┘
```

---

## II. CHI TIẾT NGHIỆP VỤ (BUSINESS LOGIC) & VỊ TRÍ CODE

Đây là các quy tắc kinh doanh (Business Rules) được cài đặt cứng trong hệ thống, sinh viên cần nắm vững để trả lời bảo vệ:

### 2.1 Nghiệp vụ Khởi tạo & Tính toán Hóa đơn (Room Invoice)
📍 **Vị trí code:** [`InvoiceServiceImpl.java: createInvoice()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L68-L110)
- **Thời điểm tạo:** Hóa đơn chính (`InvoiceType = ROOM`) được tạo tự động ngay khi lễ tân xác nhận đặt phòng tại quầy hoặc khách đặt phòng thành công trên web.
- **Công thức tính:**
  - **Số đêm lưu trú:** Tính toán từ ngày Check-in và Check-out (Mặc định tối thiểu là 1 đêm).
  - **Tiền phòng tạm tính:** = `Số đêm` x `Giá phòng/đêm` x `Số lượng phòng`.
  - **Phụ phí (nếu có trước check-in):** Các khoản như phí thêm người.
  - **Thuế VAT:** Mặc định hệ thống áp dụng thuế VAT là **8%** (Được cấu hình trong `application.yml` qua key `app.finance.vat-rate`). VAT = (Tiền phòng tạm tính + Phụ phí) x 8%.
  - **Tổng thanh toán:** Tiền phòng + Phụ phí + Thuế VAT.

### 2.2 Nghiệp vụ Thanh toán Gom Lô (Batch / Combined Payment)
📍 **Vị trí code:** [`InvoiceServiceImpl.java: getCombinedInvoice()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L160-L170)
Khi một khách hàng đặt nhiều phòng (Nhiều Bookings), hệ thống hỗ trợ thanh toán 1 lần cho tất cả:
- **Điều kiện gom lô:** Các Booking phải thuộc **cùng một khách hàng** (`customerId` trùng khớp).
- **Cơ chế QR Code:** Hệ thống cộng gộp tổng tiền của các Hóa đơn `PENDING` và sinh ra một mã VietQR duy nhất. Mã nội dung chuyển khoản được băm (Hash) theo danh sách Booking ID (Ví dụ: `HMSB` + `Hash`). Đảm bảo mỗi lần gom lô là một mã chuyển khoản duy nhất.

### 2.3 Nghiệp vụ Thanh toán tại Quầy (Pay at Desk)
📍 **Vị trí code:** [`InvoiceServiceImpl.java: processReceptionistPayment()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L226-L301)
Lễ tân thao tác trực tiếp với khách bằng 3 hình thức:
- **Tiền mặt (CASH):** Lễ tân bắt buộc phải nhập số tiền khách đưa (`cashReceived`). Hệ thống tự động tính tiền thừa trả lại (`changeAmount` = `cashReceived` - Tổng Hóa đơn). Nếu tiền khách đưa nhỏ hơn tổng tiền, hệ thống ném lỗi `BadRequestException`. Tiền đưa và tiền thối được lưu lại vào DB.
- **Chuyển khoản (TRANSFER) / Quẹt thẻ (CARD):** Hệ thống yêu cầu lễ tân đánh dấu checkbox "Đã xác nhận nhận tiền" (`paymentConfirmed = true`). Không có tiền thừa (`changeAmount = null`).

### 2.4 Nghiệp vụ Check-out & Phụ thu (Checkout & Surcharge)
📍 **Vị trí code:** [`CheckoutServiceImpl.java: confirmPayment()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L58-L178) và [`releaseRoom()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L182-L215)
- **Phụ thu (Surcharge):** Quá trình lưu trú khách có thể dùng Minibar, làm hỏng đồ, hoặc gọi dịch vụ ngoài. Tại thời điểm check-out, lễ tân yêu cầu Housekeeping đi kiểm phòng.
- Nếu có chi phí phát sinh, hệ thống không cộng dồn vào hóa đơn tiền phòng ban đầu, mà sinh ra một hóa đơn mới hoàn toàn với `InvoiceType = SURCHARGE`. Việc tách bạch 2 hóa đơn giúp dễ dàng đối soát kế toán và minh bạch với khách. Khách phải thanh toán xong Hóa đơn Surcharge này trước khi hoàn tất thủ tục trả phòng.
- **Trả phòng (Release Room):** Khi trả phòng, `BookingStatus` chuyển thành `CHECKED_OUT`. Đồng thời, trạng thái phòng thực tế chuyển sang `DIRTY` (Phòng bẩn) và tự động tạo Task dọn dẹp cho bộ phận Housekeeping.

### 2.5 Job Tự động Check-out (Auto-Checkout Cron Job)
📍 **Vị trí code:** [`CheckoutServiceImpl.java: autoCheckoutOverdueBookings()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L219-L261)
- Nếu sau **12:00 trưa** ngày trả phòng mà khách chưa làm thủ tục Check-out:
  - Nếu khách **Chưa từng đến (No-show)**: Tự động đổi trạng thái phòng thành `AVAILABLE` (Phòng trống), lưu lịch sử là "Khách chưa đến".
  - Nếu khách **Đã ở (Checked-in)**: Tự động Check-out, đổi phòng thành `DIRTY` báo Housekeeping dọn, lưu lịch sử "Hệ thống tự check-out do quá giờ". Booking chuyển thành `CHECKED_OUT`.

---

## III. QUY TRÌNH LUỒNG DỮ LIỆU TỪ FRONTEND ĐẾN BACKEND (END-TO-END DATA FLOW)

Để sinh viên có cái nhìn toàn cảnh khi trả lời bảo vệ, dưới đây là bản đồ luồng kết nối trực tiếp từ Giao diện React (Frontend) gọi xuống API (Backend).

### 3.1 Luồng Hiển thị & Thanh toán Hóa đơn (Invoice Flow)

| Bước trên UI (Luồng đi - Request) | Gọi API (Endpoint) | Xử lý tại Backend (Service) | Kết quả trả về & UI (Luồng về - Response) |
| :--- | :--- | :--- | :--- |
| **Lễ tân mở màn hình Hóa Đơn:**<br/>📍 [`InvoiceManager.jsx`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/InvoiceManager.jsx) (hàm `fetchData()`) | `GET /api/v1/invoices` | 📍 [`InvoiceServiceImpl.java#searchInvoices()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L330)<br/>Lọc hóa đơn theo keyword và trạng thái (PAID/PENDING). | Trả về `Page<InvoiceResponse>`.<br/>*(Luồng về xử lý tiếp tại hàm `fetchData()`)*<br/>UI gọi `setItems()` để đổ dữ liệu ra bảng DataTable. |
| **Khách hàng thanh toán Online:**<br/>📍 [`InvoicePage.jsx`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/pages/InvoicePage.jsx)<br/>Màn hình hiển thị mã QR động (component `QrPlaceholder`) cho khách quét. | `POST /api/v1/invoices/webhook/payment-success/{id}` | 📍 [`InvoiceServiceImpl.java#confirmPaymentSuccess()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L113)<br/>Ngân hàng gọi Webhook báo thành công -> Update `PAID`. | Trả về HTTP 200 OK.<br/>*(Frontend có Polling interval check)*<br/>Màn hình điện thoại khách tự động cập nhật và hiện "Thanh toán thành công". |
| **Demo Thanh Toán (Không cần quẹt tiền thật):**<br/>📍 [`InvoicePage.jsx`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/pages/InvoicePage.jsx) (hàm `handleSimulatePayment()`)<br/>Bấm nút "Giả lập thanh toán" trên UI. | `POST /api/v1/invoices/batch/simulate-payment-success` | 📍 [`InvoiceServiceImpl.java#confirmCombinedPaymentSuccess()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L173)<br/>Giả lập ngân hàng trả webhook thành công. | Trả về `CombinedInvoiceResponse`.<br/>*(Luồng về xử lý tiếp tại hàm `handleSimulatePayment()`)*<br/>UI văng Toast báo "Demo thanh toán thành công", đóng form QR. |
| **Lễ tân thu tiền tại quầy (Tiền mặt/Thẻ):**<br/>📍 [`ReceptionistPaymentModal.jsx`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/ReceptionistPaymentModal.jsx) (hàm `handlePay()`)<br/>Lễ tân nhập số tiền khách đưa. | `POST /api/v1/invoices/batch/pay-at-desk` | 📍 [`InvoiceServiceImpl.java#processReceptionistPayment()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L226)<br/>Tính toán tiền thừa `changeAmount`, lưu lịch sử `CASH`. | Trả về `CombinedInvoiceResponse`.<br/>*(Luồng về xử lý tiếp tại hàm `handlePay()`)*<br/>UI gọi `onSuccess()`, hiển thị tiền thừa cho khách, đóng Modal, reload hóa đơn. |

### 3.2 Luồng Check-out & Phụ thu Chi Tiết (Checkout Flow)
Tất cả các thao tác này bắt nguồn từ Component 📍 [`CheckOutManager.jsx`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckOutManager.jsx) trên giao diện Lễ tân.

1. **Xem Hóa đơn trả phòng lúc Check-out**: 
   - **Luồng đi (Request):** Lễ tân bấm vào 1 phòng đang ở, gọi 📍 [`CheckOutManager.jsx#openCheckout()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckOutManager.jsx#L118) trên UI.
   - **API:** `GET /api/v1/checkout/{bookingId}/bill`
   - **Backend xử lý:** Lấy tổng hợp hóa đơn tiền phòng và hóa đơn phụ thu (nếu có). Trỏ tới 📍 [`CheckoutServiceImpl.java#getBill()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L50).
   - **Luồng về (Response):** Trả về `CheckoutBillResponse`. Giao diện cập nhật hiển thị danh sách các khoản tiền phòng và các loại phí phát sinh (Step 1 trên Modal).

2. **Thanh toán phụ thu (Surcharge)**: 
   - **Luồng đi (Request):** Lễ tân nhập số tiền phạt minibar/dịch vụ trên UI và bấm "Xác nhận thu tiền", gọi 📍 [`CheckOutManager.jsx#initiateInspection()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckOutManager.jsx#L143) hoặc 📍 [`CheckOutManager.jsx#finishCheckoutPayment()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckOutManager.jsx#L186).
   - **API:** `POST /api/v1/checkout/confirm-payment`
   - **Backend xử lý:** Hệ thống tạo hóa đơn `SURCHARGE` và set `PAID`. Đổi trạng thái phòng sang `CHECKOUT_PENDING`. Trỏ tới 📍 [`CheckoutServiceImpl.java#confirmPayment()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L58).
   - **Luồng về (Response):** Trả về trạng thái bill cập nhật. Giao diện chuyển sang Bước 3 (RELEASE_READY) cho phép giải phóng phòng.

3. **Hoàn tất trả phòng**:
   - **Luồng đi (Request):** Khách giao lại chìa khóa, Lễ tân bấm nút "Hoàn tất Check-out", gọi 📍 [`CheckOutManager.jsx#releaseRoom()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckOutManager.jsx#L206).
   - **API:** `POST /api/v1/checkout/release-room/{bookingId}`
   - **Backend xử lý:** Xác nhận khách đã giao chìa khóa. Booking chuyển về `CHECKED_OUT`. Phòng chuyển thành `DIRTY`. Auto-sinh task cho Housekeeping. Trỏ tới 📍 [`CheckoutServiceImpl.java#releaseRoom()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L182).
   - **Luồng về (Response):** Trả về kết quả thành công. Giao diện báo Toast "Giải phóng phòng thành công", tự động load lại lưới danh sách Check-out ở trang chủ.

### 3.3 Luồng Khởi tạo Hóa đơn (Booking ➔ Invoice Flow)
Đây là luồng "mở màn" vòng đời của 1 Hóa đơn, xuất phát từ màn hình Đặt phòng.

| Bước trên UI (Luồng đi - Request) | Gọi API (Endpoint) | Xử lý tại Backend (Service) | Kết quả trả về & UI (Luồng về - Response) |
| :--- | :--- | :--- | :--- |
| **Khách hàng/Lễ tân Đặt phòng:**<br/>Bấm xác nhận Booking trên UI. | `POST /api/v1/bookings` | Booking Service tạo `Booking`. Sau đó **tự động gọi ngầm** sang 📍 [`InvoiceServiceImpl.java#createInvoice()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L68) để sinh Hóa đơn ở trạng thái `PENDING`. | Trả về `BookingResponse` kèm `InvoiceId`.<br/>UI chuyển hướng sang màn hình thanh toán hóa đơn. |

### 3.4 Luồng Tự Động ngầm (Background Auto-Task Flow)
Luồng này **không cần Frontend**, hệ thống tự chạy ngầm (Cron Job) trên Server. Mặc dù không có UI nhưng đây là 1 nhánh cực kỳ quan trọng trong vòng đời Check-out.
- **Trigger:** Đến đúng giờ cấu hình quét qua các Booking.
- **Backend xử lý:** Quét các đơn đã quá 12h00 trưa ngày trả phòng nhưng khách chưa check-out. Trỏ tới 📍 [`CheckoutServiceImpl.java#autoCheckoutOverdueBookings()`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L219). Tự động đổi trạng thái phòng thành `DIRTY` (nếu khách đang ở) hoặc `AVAILABLE` (nếu no-show).

---

## IV. KIẾN TRÚC CODE THEO MÔ HÌNH 3-TIER (3-TIER ARCHITECTURE DETAILS)

| Layer | File Path / Class Name | Vai trò / Trách nhiệm chính |
| :--- | :--- | :--- |
| **Controller** | [`InvoiceController.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java) | REST endpoints `/api/v1/invoices`, tiếp nhận webhook, giả lập demo. |
| **Controller** | [`CheckoutController.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/checkout/CheckoutController.java) | Xử lý yêu cầu lấy bill, thanh toán phụ thu, release room. |
| **Service** | [`InvoiceServiceImpl.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java) | Logic tính thuế VAT, tiền phòng, mã QR VietQR, quản lý Transactional DB. |
| **Service** | [`CheckoutServiceImpl.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java) | Xử lý logic check-out, phối hợp (orchestration) gọi API sang module Room, Booking và Housekeeping. |
| **Security Evaluator** | [`InvoiceAccessService.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/InvoiceAccessService.java) | Kiểm tra quyền xem/thanh toán hóa đơn: Chỉ khách hàng tương ứng mới được xem hóa đơn của họ. |
| **Entities** | `Invoice.java`, `PaymentDetail.java`| Bảng DB `invoices`, chứa `vat_amount`, `cash_received`, `change_amount`. |

---

## V. BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN & HƯỚNG DẪN CODE LIVE CHI TIẾT (DEFENSE QA & LIVE CODING)

### ❓ CÂU 1: "Làm sao hệ thống bảo mật để Khách hàng A KHÔNG THỂ xem Hóa đơn của Khách hàng B?"

**Trả lời:** Bằng Spring Security Method Level Security (`@PreAuthorize`).
Tại [`InvoiceController.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java) kết hợp với bean [`InvoiceAccessService`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/InvoiceAccessService.java):
```java
@GetMapping("/{id}")
@PreAuthorize("@invoiceAccessService.canAccessInvoice(#id, authentication)")
public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) { ... }
```
Logic trong `InvoiceAccessService`:
1. Nếu User có Role `Lễ tân/Admin` -> Được xem toàn bộ (Return true).
2. Nếu là `Khách hàng` -> Lấy `email` từ Token JWT đang đăng nhập so sánh với `customer.email` trong Booking của Hóa đơn đó. Phải khớp mới cho xem.

---

### ❓ CÂU 2: "Khi thanh toán thành công, làm thế nào đảm bảo Hóa đơn và Đặt phòng cùng cập nhật trạng thái an toàn trong 1 giao dịch?"

**Trả lời:** Dùng annotation `@Transactional` của Spring Data JPA.
Tại [`InvoiceServiceImpl.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L113), method `confirmPaymentSuccess`:
```java
@Transactional
public InvoiceResponse confirmPaymentSuccess(Long bookingId) {
    // 1. Đổi trạng thái Hóa đơn sang PAID
    invoice.setPaymentStatus(PaymentStatus.PAID);
    invoiceRepository.save(invoice);

    // 2. Đồng bộ đổi trạng thái Booking sang CONFIRMED (Chờ Check-in)
    booking.setStatus(BookingStatus.CONFIRMED);
    bookingRepository.save(booking);
}
```
`@Transactional` đảm bảo tính **Atomic (Nguyên tố)**: Nếu dòng lưu `booking` xảy ra lỗi (như DB timeout), thì thao tác lưu `invoice` ở trên cũng tự động Rollback lại. Không bao giờ xảy ra lỗi dữ liệu lệch pha.

---

### ❓ CÂU 3: "Giả lập Thanh toán (Simulate Payment) hoạt động như thế nào trong lúc Demo Đồ Án cho Thầy Cô?"

**Trả lời:** Vì việc chuyển khoản tiền thật qua ngân hàng mất thời gian, hệ thống xây dựng API `/api/v1/invoices/batch/simulate-payment-success` tại [`InvoiceController.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java).
Khi bấm nút *"Thanh toán thành công (Demo)"* trên UI React, Frontend gọi API này. Backend sẽ bỏ qua bước check callback từ webhook ngân hàng thực tế, tiến hành đổi trạng thái trực tiếp sang `PAID` và cập nhật Booking. Giúp tiết kiệm thời gian demo nhưng vẫn giữ nguyên toàn bộ flow nghiệp vụ DB.

---

### ❓ CÂU 4: "Nghiệp vụ Check-out xử lý phụ phí (Minibar) thế nào để minh bạch?"

**Trả lời:** Khi có phụ phí, Backend [`CheckoutServiceImpl.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/checkout/impl/CheckoutServiceImpl.java#L114) sẽ tự tạo ra một `Invoice` mới tinh với type là `SURCHARGE` thay vì cộng dồn (override) lên hóa đơn phòng cũ (`ROOM`).
- Hóa đơn phòng (Room Invoice): Chứa tiền phòng, xuất cho khách khi thanh toán phòng.
- Hóa đơn phụ thu (Surcharge Invoice): Chỉ xuất hiện khi có phí đền bù hoặc sử dụng thêm, yêu cầu lễ tân thu tiền lúc khách trả chìa khóa. Khách nhìn bill sẽ thấy 2 khoản tách biệt rõ ràng.

---

### ❓ CÂU 5: "Thầy/Cô yêu cầu bổ sung Thuế bảo vệ môi trường (2%) vào Hóa đơn. Em hãy Live Code."

**Bước 1**: Entity `Invoice.java`, thêm cột `@Column(name = "env_tax") private BigDecimal envTax;`
**Bước 2**: Trong [`InvoiceServiceImpl.java`](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/impl/InvoiceServiceImpl.java#L94) method `createInvoice`:
```java
BigDecimal vatAmount = subTotalBeforeTax.multiply(new BigDecimal("0.08")); // VAT 8%
BigDecimal envTax = subTotalBeforeTax.multiply(new BigDecimal("0.02")); // Env Tax 2%
BigDecimal total = subTotalBeforeTax.add(vatAmount).add(envTax);
```
**Bước 3**: Response DTO `InvoiceResponse.java` thêm trường `envTax`.
**Bước 4**: Giao diện React thêm 1 dòng hiển thị Thuế BVMT bên cạnh dòng VAT.
