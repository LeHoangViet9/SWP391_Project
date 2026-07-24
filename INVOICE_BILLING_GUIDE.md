# 🧾 Hướng Dẫn Chi Tiết Chuyên Sâu: Quản Lý Hóa Đơn & Thanh Toán (Invoice & Billing Management) & Kịch Bản Bảo Vệ Đồ Án

---

## I. TỔNG QUAN HỆ THỐNG & MÔ HÌNH THANH TOÁN (PAYMENT & BILLING MODEL)

Hệ thống Quản lý Khách sạn (HMS) thiết kế mô hình quản lý tài chính và hóa đơn dựa trên 3 quy trình cốt lõi:

```
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

## II. KIẾN TRÚC CODE THEO MÔ HÌNH 3-TIER (3-TIER ARCHITECTURE DETAILS)

| Layer | File Path / Class Name | Vai trò / Trách nhiệm chính |
| :--- | :--- | :--- |
| **Controller** | [InvoiceController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java) | REST endpoints `/api/v1/invoices`, tiếp nhận webhook thanh toán, giả lập demo, thanh toán lô (batch). |
| **Service Interface** | `InvoiceService.java` | Khai báo các phương thức thanh toán, tạo invoice, xác nhận chuyển khoản. |
| **Service Impl** | `InvoiceServiceImpl.java` (`com.hms.service.booking.impl`) | Tính toán tổng tiền phòng + tiền dịch vụ, quản lý `@Transactional` cập nhật Invoice `PAID` và Booking `CONFIRMED`. |
| **Security Evaluator** | [InvoiceAccessService.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/InvoiceAccessService.java) | Bean Spring Security `@invoiceAccessService` kiểm tra quyền xem/thanh toán hóa đơn của đúng chủ sở hữu (Email/Phone). |
| **Entities** | `Invoice.java`, `PaymentDetail.java` | Bảng DB `invoices` và `payment_details`. |
| **Request & Response DTOs**| `InvoiceRequest.java`, `ReceptionistPaymentRequest.java`, `InvoiceResponse.java`, `CombinedInvoiceResponse.java` | DTOs nhận và trả dữ liệu hóa đơn kết hợp (Batch). |
| **Frontend Components** | [InvoiceManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/InvoiceManager.jsx), [CheckoutModal.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckoutModal.jsx) | Màn hình quản lý hóa đơn, Modal quét VietQR động, nút giả lập thanh toán tại quầy. |

---

## III. QUY TRÌNH LUỒNG DỮ LIỆU & CHI TIẾT API ENDPOINTS

### 3.1 Bảng Chi Tiết API Endpoints

| HTTP Method | Endpoint | Security Check | Service Method | Mô tả Luồng Xử Lý |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/invoices` | `hasAuthority('INVOICE_VIEW')` | `createInvoice(request)` | Khởi tạo Hóa đơn ban đầu trạng thái `PENDING` kèm thông tin mã QR. |
| `POST` | `/api/v1/invoices/webhook/payment-success/{bookingId}` | `hasAuthority('INVOICE_VIEW')` | `confirmPaymentSuccess(bookingId)` | Webhook xác nhận thanh toán thành công 1 Booking -> Đổi Invoice `PAID` & Booking `CONFIRMED`. |
| `GET` | `/api/v1/invoices/search` | `hasAuthority('INVOICE_VIEW')` | `searchInvoices(...)` | Phân trang, tìm kiếm hóa đơn theo `keyword`, `status` (`PENDING`, `PAID`, `CANCELLED`), `fromDate`, `toDate`. |
| `GET` | `/api/v1/invoices/batch` | `@invoiceAccessService.canAccessBookings(#bookingIds, authentication)` | `getCombinedInvoice(bookingIds)` | Lấy Hóa đơn tổng hợp (Combined Invoice) cho danh sách nhiều `bookingIds` thuộc giỏ hàng. |
| `POST` | `/api/v1/invoices/batch/pay-at-desk` | `hasAuthority('INVOICE_VIEW')` | `processReceptionistPayment(...)` | Lễ tân thu tiền mặt/quẹt thẻ tại quầy, cập nhật toàn bộ booking sang chờ check-in. |
| `POST` | `/api/v1/invoices/batch/simulate-payment-success` | `@invoiceAccessService.canAccessBookings(#bookingIds, authentication)` | `confirmCombinedPaymentSuccess(...)` | **Giả lập Thanh toán**: Dùng cho Demo VietQR local mà không cần nạp tiền ngân hàng thật. |
| `GET` | `/api/v1/invoices/{id}` | `@invoiceAccessService.canAccessInvoice(#id, authentication)` | `getInvoiceById(id)` | Lấy chi tiết Hóa đơn theo ID. |
| `GET` | `/api/v1/invoices/booking/{bookingId}` | `@invoiceAccessService.canAccessBooking(#bookingId, authentication)` | `getInvoiceByBookingId(bookingId)` | Lấy chi tiết Hóa đơn theo `bookingId`. |

---

## IV. BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN & HƯỚNG DẪN CODE LIVE CHI TIẾT TỪNG DÒNG (DEFENSE QA & LIVE CODING EXAMPLES)

---

### ❓ CÂU 1: "Làm sao hệ thống bảo mật để Khách hàng A KHÔNG THỂ xem Hóa đơn của Khách hàng B?"

#### 📍 Vị trí Code:
Dòng 153 tại [InvoiceController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java#L153) và [InvoiceAccessService.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/InvoiceAccessService.java#L66-L78):

```java
// Controller.java
@GetMapping("/{id}")
@PreAuthorize("@invoiceAccessService.canAccessInvoice(#id, authentication)")
public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) { ... }
```

#### 💡 Phân Tích Logic trong [InvoiceAccessService.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/booking/InvoiceAccessService.java#L66-L78):
```java
public boolean canAccessInvoice(Long invoiceId, Authentication authentication) {
    if (!isAuthenticated(authentication) || invoiceId == null) return false;
    
    // Bước 1: Nếu người dùng có authority INVOICE_VIEW (Lễ tân/Admin) -> Cho phép xem mọi Hóa đơn.
    if (hasInvoiceView(authentication)) return true;

    // Bước 2: Nếu là Khách hàng -> Kiểm tra email trong Booking của Hóa đơn có khớp với Token email đăng nhập không.
    return invoiceRepository.findById(invoiceId)
            .map(invoice -> invoice.getBooking() != null
                    && invoice.getBooking().getCustomer() != null
                    && invoice.getBooking().getCustomer().getEmail() != null
                    && authentication.getName() != null
                    && invoice.getBooking().getCustomer().getEmail().equalsIgnoreCase(authentication.getName()))
            .orElse(false);
}
```

---

### ❓ CÂU 2: "Thầy/Cô yêu cầu bổ sung Thuế VAT (10%) và Phụ phí Phục vụ (5%) vào Hóa đơn. Hãy thực hiện Live Coding từng bước."

#### 🛠️ Hướng Dẫn Thực Hiện 4 Bước Chi Tiết:

#### **Bước 1**: Sửa Entity `Invoice.java`
Thêm các cột lưu tiền thuế và phụ phí:
```java
@Column(name = "vat_amount")
private BigDecimal vatAmount;

@Column(name = "service_fee")
private BigDecimal serviceFee;
```

#### **Bước 2**: Sửa Logic trong Service `InvoiceServiceImpl.java`
Trong phương thức tính tổng tiền hóa đơn:
```java
BigDecimal roomTotal = booking.getTotalAmount();
BigDecimal serviceTotal = calculateServicesTotal(booking); // Tiền dịch vụ phát sinh
BigDecimal subTotal = roomTotal.add(serviceTotal);

// Tính Thuế VAT 10% và Phụ phí Phục vụ 5%
BigDecimal vatAmount = subTotal.multiply(new BigDecimal("0.10"));
BigDecimal serviceFee = subTotal.multiply(new BigDecimal("0.05"));
BigDecimal grandTotal = subTotal.add(vatAmount).add(serviceFee);

invoice.setVatAmount(vatAmount);
invoice.setServiceFee(serviceFee);
invoice.setTotalAmount(grandTotal);
```

#### **Bước 3**: Sửa Response DTO `InvoiceResponse.java`
```java
private BigDecimal vatAmount;
private BigDecimal serviceFee;
private BigDecimal grandTotal;
```

#### **Bước 4**: Sửa Giao diện React [InvoiceManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/InvoiceManager.jsx)
Trong Modal Xem Chi Tiết Hóa Đơn:
```javascript
<div className="border-t pt-2 space-y-1 text-sm">
  <div className="flex justify-between text-slate-600">
    <span>Tạm tính tiền phòng & dịch vụ:</span>
    <span>{invoice.subTotal?.toLocaleString()} VNĐ</span>
  </div>
  <div className="flex justify-between text-slate-600">
    <span>Thuế VAT (10%):</span>
    <span>{invoice.vatAmount?.toLocaleString()} VNĐ</span>
  </div>
  <div className="flex justify-between text-slate-600">
    <span>Phụ phí phục vụ (5%):</span>
    <span>{invoice.serviceFee?.toLocaleString()} VNĐ</span>
  </div>
  <div className="flex justify-between font-bold text-base text-amber-700 border-t pt-2">
    <span>TỔNG CỘNG THANH TOÁN:</span>
    <span>{invoice.totalAmount?.toLocaleString()} VNĐ</span>
  </div>
</div>
```

---

### ❓ CÂU 3: "Khi thanh toán thành công, làm thế nào hệ thống đảm bảo cả Hóa đơn và Đặt phòng đều chuyển trạng thái thành công trong 1 giao dịch an toàn (Transaction)?"

#### 📍 Vị trí Code:
Phương thức `confirmPaymentSuccess` trong `InvoiceServiceImpl.java`:

```java
@Transactional
public InvoiceResponse confirmPaymentSuccess(Long bookingId) {
    Invoice invoice = invoiceRepository.findByBookingId(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

    // 1. Đổi trạng thái Hóa đơn sang PAID
    invoice.setPaymentStatus(PaymentStatus.PAID);
    invoice.setPaidAt(LocalDateTime.now());
    invoiceRepository.save(invoice);

    // 2. Đồng bộ đổi trạng thái Booking sang CONFIRMED (Chờ Check-in)
    Booking booking = invoice.getBooking();
    booking.setStatus(BookingStatus.CONFIRMED);
    bookingRepository.save(booking);

    return invoiceMapper.toResponse(invoice);
}
```
- Annotation `@Transactional` đảm bảo tính **Atomic (Nguyên tố)**: Nếu việc lưu `booking` bị lỗi ngắt kết nối DB, toàn bộ thao tác đổi `PaymentStatus.PAID` của Invoice cũng sẽ tự động Rollback, không bao giờ rơi vào trạng thái lỗi: *"Hóa đơn ghi Đã thanh toán nhưng Booking vẫn ở trạng thái Chờ"*.

---

### ❓ CÂU 4: "Giả lập Thanh toán (Simulate Payment) hoạt động như thế nào trong lúc Demo cho Thầy Cô?"

#### 📍 Vị trí Code:
Dòng 125-135 tại [InvoiceController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/booking/InvoiceController.java#L125-L135):

```java
@PostMapping("/batch/simulate-payment-success")
@PreAuthorize("@invoiceAccessService.canAccessBookings(#bookingIds, authentication)")
public ResponseEntity<ApiResponse<CombinedInvoiceResponse>> simulatePaymentSuccess(
        @RequestParam List<Long> bookingIds) {
    return ResponseEntity.ok(ApiResponse.<CombinedInvoiceResponse>builder()
            .success(true)
            .message("Thanh toán mô phỏng thành công")
            .data(invoiceService.confirmCombinedPaymentSuccess(bookingIds))
            .status(HttpStatus.OK)
            .build());
}
```
- **Ý nghĩa nghiệp vụ**: Khi chạy Demo dưới localhost, việc chuyển khoản tiền thật qua ngân hàng rất mất thời gian. Khi bấm nút *"Thanh toán thành công (Demo)"* trên Modal VietQR [CheckoutModal.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CheckoutModal.jsx), Frontend gọi API này để hệ thống giả lập Webhook ngân hàng thành công ngay lập tức mà vẫn chạy đầy đủ logic nghiệp vụ Backend.

---

### ❓ CÂU 5: "Làm thế nào để xuất Hóa đơn ra file PDF hoặc In Hóa đơn trực tiếp từ giao diện React?"

#### 1. Phương án In Trực Tiếp (Browser Native Printing)
Thêm nút "In Hóa đơn" trong [InvoiceManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/InvoiceManager.jsx):

```javascript
const handlePrintInvoice = () => {
  window.print();
};

// Trong CSS (@media print):
// @media print {
//   body * { visibility: hidden; }
//   #invoice-modal-content, #invoice-modal-content * { visibility: visible; }
//   #invoice-modal-content { position: absolute; left: 0; top: 0; width: 100%; }
// }
```

#### 2. Phương án Backend PDF Service (iText Library)
Tạo API Endpoint `GET /api/v1/invoices/{id}/pdf` trả về `byte[]` binary:
```java
@GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> exportInvoicePdf(@PathVariable Long id) {
    byte[] pdfBytes = invoiceService.generateInvoicePdf(id);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentDispositionFormData("filename", "invoice_" + id + ".pdf");
    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
}
```
