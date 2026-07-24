# 📘 Hướng Dẫn Chi Tiết Chuyên Sâu: Nghiệp Vụ, Luồng Hoạt Động & Bộ Câu Hỏi Bảo Vệ Quản Lý Khách Hàng (Customer Management)

---

## I. TỔNG QUAN HỆ THỐNG & MÔ HÌNH NGHIỆP VỤ THỰC TẾ (BUSINESS CONTEXT & MODEL)

### 1.1 Vai trò Nghiệp vụ của Quản lý Khách hàng trong Khách sạn
Tính năng **Quản lý Khách hàng (Customer Management)** đóng vai trò trung tâm trong Hệ thống Quản lý Khách sạn (HMS) với 3 mục tiêu nghiệp vụ chính:
1. **Khai báo Tạm trú Tạm vắng & Tuân thủ Pháp lý**: Lưu trữ bắt buộc các thông tin định danh cá nhân (Số CCCD/Hộ chiếu `idNumberCard`, Loại giấy tờ `idType`, Họ tên `fullName`, Số điện thoại `phone`, Quốc tịch `nationality`) của mọi khách hàng lưu trú để phục vụ báo cáo với chính quyền địa phương.
2. **Quản lý 2 Nhóm Khách hàng**:
   - **Khách hàng Tự Đăng ký Online (Registered Customer)**: Khách hàng tạo tài khoản trực tuyến qua trang Đăng ký. Hệ thống lưu đồng thời 1 bản ghi ở bảng `users` (dùng để đăng nhập) và 1 bản ghi ở bảng `customers` (dùng để lưu thông tin hồ sơ). Khớp nối qua `email`.
   - **Khách hàng Vãng lai (Walk-in Guest / Receptionist Created)**: Khách đến đặt phòng trực tiếp tại quầy lễ tân. Lễ tân chỉ tạo 1 bản ghi trong bảng `customers` để đặt phòng. **Không tạo tài khoản `users`** nhằm giảm rác Database và bảo mật.
3. **Bảo toàn Lịch sử Doanh thu & Quản lý Vòng đời**: Khách hàng khi dừng hoạt động chỉ được **Xóa mềm (Soft Delete)** để giữ nguyên dữ liệu các Đặt phòng (`Booking`) và Hóa đơn (`Invoice`) đã phát sinh trong quá khứ, đảm bảo báo cáo tài chính chính xác 100%.

---

### 1.2 Cấu trúc Bảng Database (`customers`) & Java Entity
Được ánh xạ trong Java Entity [Customer.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/entity/customer/Customer.java):

```java
@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column(name = "id_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private IdType idType; // Enum: CCCD, PASSPORT, OTHER

    @Column(name = "id_number_card", nullable = false, unique = true)
    private String idNumberCard;

    private String nationality;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private AccountStatus status; // Enum: ACTIVE, INACTIVE, BANNED
}
```

---

## II. KIẾN TRÚC CODE 3-TIER (3-TIER ARCHITECTURE)

| Layer | File Path / Class Name | Vai trò / Trách nhiệm chính |
| :--- | :--- | :--- |
| **Controller** | [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java) | Tiếp nhận REST API `/api/v1/customers`, kiểm tra phân quyền Spring Security SpEL `@PreAuthorize`. |
| **Service Interface** | `CustomerService.java` | Khai báo các phương thức chuẩn cho nghiệp vụ khách hàng. |
| **Service Impl** | [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java) | Thực thi toàn bộ logic nghiệp vụ, quản lý Transaction `@Transactional`, kiểm tra trùng lặp email/phone/CCCD, xử lý xóa mềm & xóa vĩnh viễn. |
| **Repository** | [CustomerRepository.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/repository/customer/CustomerRepository.java) | Tương tác DB qua JPQL. Thực thi câu truy vấn tìm kiếm đa tiêu chí `searchCustomer`. |
| **Request DTO** | [CustomerCreateDTO.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/request/CustomerCreateDTO.java) | Chứa thuộc tính dữ liệu gửi từ Client và Bean Validation (`@NotBlank`, `@Pattern`, `@Email`). |
| **Response DTO** | [CustomerResponse.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/response/CustomerResponse.java) | Format dữ liệu trả về cho Frontend. |
| **Frontend UI** | [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx) | Màn hình Quản lý Khách hàng React, chứa bảng dữ liệu, Modal form thêm/sửa, Debounce 300ms tìm kiếm và Client Validation. |

---

## III. CHI TIẾT 5 LUỒNG NGHIỆP VỤ XỬ LÝ TRONG HỆ THỐNG (DETAILED WORKFLOWS)

```
                    ┌──────────────────────────────────────────────────┐
                    │       Màn hình Quản Lý Khách Hàng (React)        │
                    └────────────────────────┬─────────────────────────┘
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      │                  │                   │                   │                  │
      ▼                  ▼                   ▼                   ▼                  ▼
【Luồng 1: Self-Profile】 【Luồng 2: Walk-In】 【Luồng 3: Re-Booking】 【Luồng 4: Search】 【Luồng 5: Delete】
Khách tự xem/sửa     Lễ tân tạo khách mới    Tự đồng bộ khách cũ   Tìm kiếm đa tiêu chí  Xóa mềm / Restore /
Profile qua JWT      tại quầy dịch vụ        khi đặt phòng lại    với Debounce 300ms    Xóa vĩnh viễn (Force)
```

---

### 🔄 LUỒNG 1: Khách Hàng Tự Đăng Ký & Tự Cập Nhật Hồ Sơ (Self-Service Profile Flow)

```
Client (Customer) ➔ Gửi API (JWT Token) ➔ SpEL Security Evaluator ➔ Service Update ➔ DB
```

1. **Bước 1**: Khách hàng đăng nhập vào ứng dụng, hệ thống cấp mã **JWT Token** chứa email người dùng (`authentication.name`).
2. **Bước 2**: Khách vào trang Profile cá nhân, chọn cập nhật thông tin và bấm "Lưu". Frontend gửi HTTP Request `PUT /api/v1/customers/{id}` kèm JWT Token trong Header.
3. **Bước 3**: Backend [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java#L91) đón request và kích hoạt mệnh đề Spring SpEL:
   ```java
   @PreAuthorize("hasAuthority('CUSTOMER_UPDATE') or (hasRole('CUSTOMER') and #customerCreateDTO.email == authentication.name)")
   ```
4. **Bước 4**: Spring Security kiểm tra:
   - Nếu là Lễ tân/Admin (có authority `CUSTOMER_UPDATE`) ➔ Được phép sửa bất kỳ ID nào.
   - Nếu là Khách hàng (`ROLE_CUSTOMER`) ➔ So sánh email trong Body `#customerCreateDTO.email` có trùng khớp với `authentication.name` (Email trong Token) hay không.
   - **Nếu khớp**: Cho phép đi tiếp vào Service.
   - **Nếu không khớp** (Cố tình nhập email người khác): Trả về lỗi `403 Forbidden`.
5. **Bước 5**: `CustomerServiceImpl.updateCustomer` kiểm tra email/phone/CCCD mới có bị trùng với khách hàng khác trong DB không. Nếu hợp lệ ➔ Lưu DB và trả về `CustomerResponse`.

---

### 🔄 LUỒNG 2: Lễ Tân Tạo Khách Hàng Vãng Lai Tại Quầy (Walk-In Guest Flow)

```
Lễ tân gõ Form ➔ Client Validation ➔ POST /api/v1/customers ➔ Server Validation ➔ Check Trùng ➔ Save DB
```

1. **Bước 1**: Khách đến quầy lễ tân đặt phòng. Lễ tân mở giao diện [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx), bấm nút **"+ Add Customer"**.
2. **Bước 2 (Client Validation)**: Lễ tân nhập thông tin vào Modal Form. Hàm `validateField` ở Frontend kiểm tra ngay tại client:
   - `fullName`: Không được trống, không chứa khoảng trắng thừa ở đầu/cuối hay liên tiếp (`/^\s|\s$/`).
   - `phone`: Phải có 10 chữ số bắt đầu bằng số `0` (`/^0[0-9]{9}$/`).
   - `idNumberCard`: Từ 6-20 ký tự chữ/số/dấu gạch (`/^[A-Za-z0-9\-]{6,20}$/`).
3. **Bước 3**: Lễ tân bấm "Lưu". Frontend gửi `POST /api/v1/customers` với body JSON.
4. **Bước 4 (Server Validation)**: Backend [CustomerCreateDTO.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/request/CustomerCreateDTO.java) thực thi Bean Validation (`@NotBlank`, `@Email`, `@Pattern`). Nếu lỗi ➔ Ném `400 Bad Request`.
5. **Bước 5 (Logic Check Trùng)**: Service [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java#L88-L93) kiểm tra:
   ```java
   if(customerRepository.existsByPhone(customerDTO.getPhone())){
       throw new ConflictException(messageSource.getMessage("error.phone.existed", ...));
   }
   if(customerRepository.existsByIdNumberCard(customerDTO.getIdNumberCard())) {
       throw new ConflictException(messageSource.getMessage("error.idCard.existed", ...));
   }
   ```
6. **Bước 6**: Nếu không trùng ➔ Gán `status = AccountStatus.ACTIVE`, lưu DB và trả về `HTTP 201 Created`.

---

### 🔄 LUỒNG 3: Tự Động Cập Nhật Thông Tin Khách Cũ Khi Đặt Phòng (Re-Booking Auto-Sync Flow)

```
Đặt phòng lại ➔ Nhập Email cũ ➔ Hệ thống phát hiện email trùng ➔ Tự đồng bộ thông tin mới ➔ Trả về Customer ID
```

1. **Bài toán Nghiệp vụ**: Khách hàng cũ quay lại khách sạn đặt phòng hoặc Lễ tân nhập lại email của khách từng ở trước đây.
2. **Bước 1**: Khi gọi `POST /api/v1/customers`, Service kiểm tra `customerRepository.existsByEmail(customerDTO.getEmail()) == true`.
3. **Bước 2**: Thay vì báo lỗi *"Email đã tồn tại"* ngắt đứt luồng đặt phòng của khách, [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java#L42-L85) tự động xử lý:
   ```java
   Customer customer = customerRepository.findByEmailAndStatus(customerDTO.getEmail(), AccountStatus.ACTIVE)
           .orElseThrow(...);

   boolean updated = false;
   // Đối chiếu và cập nhật tên, số điện thoại, CCCD, quốc tịch nếu có thay đổi
   if (customerDTO.getFullName() != null && !customerDTO.getFullName().trim().equals(customer.getFullName())) {
       customer.setFullName(customerDTO.getFullName().trim());
       updated = true;
   }
   ...
   if (updated) {
       customer = customerRepository.save(customer);
   }
   return customerMapper.toResponse(customer);
   ```
4. **Bước 3**: Trả về hồ sơ Khách hàng hiện tại để hệ thống tiếp tục luồng tạo Đặt phòng (`Booking`) một cách mượt mà.

---

### 🔄 LUỒNG 4: Tìm Kiếm & Phân Trang Đa Tiêu Chí (Search & Pagination Flow)

```
Gõ từ khóa ➔ Debounce 300ms ➔ GET /api/v1/customers?keyword=... ➔ Service bọc % ➔ JPQL Query ➔ Render DataTable
```

1. **Bước 1**: Lễ tân gõ từ khóa vào ô tìm kiếm (ví dụ: `"Johnson"`, `"0904"`, `"Việt Nam"`, `"00109"`) hoặc thay đổi bộ lọc trạng thái (`ACTIVE`, `INACTIVE`, `BANNED`).
2. **Bước 2**: Component [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx#L118-L122) kích hoạt **Debounce 300ms**:
   ```javascript
   useEffect(() => {
     const timer = setTimeout(() => {
       fetchData(page);
     }, 300);
     return () => clearTimeout(timer);
   }, [page, search, statusFilter, fetchData]);
   ```
3. **Bước 3**: Frontend gọi API `GET /api/v1/customers?keyword=...&status=ACTIVE&page=0&size=10`.
4. **Bước 4**: Controller nhận request, gọi `customerService.getCustomers(...)`.
5. **Bước 5**: Service [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java#L157-L161) bọc wildcard `%` phục vụ tìm kiếm gần đúng (partial match):
   ```java
   String searchKeyword = (keyword != null && !keyword.trim().isEmpty())
           ? "%" + keyword.trim() + "%"
           : null;
   ```
6. **Bước 6**: Repository [CustomerRepository.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/repository/customer/CustomerRepository.java#L39-L55) thực thi câu JPQL rút gọn chuẩn (đồng bộ phong cách với module `Room`):
   ```sql
   SELECT c FROM Customer c
   WHERE (:status IS NULL OR c.status = :status)
   AND (
       CAST(:keyword AS string) IS NULL
       OR LOWER(c.fullName) LIKE LOWER(CAST(:keyword AS string))
       OR LOWER(c.email) LIKE LOWER(CAST(:keyword AS string))
       OR c.phone LIKE CAST(:keyword AS string)
       OR c.idNumberCard LIKE CAST(:keyword AS string)
       OR LOWER(c.nationality) LIKE LOWER(CAST(:keyword AS string))
       OR CAST(c.id AS string) LIKE CAST(:keyword AS string)
   )
   ```
7. **Bước 7**:
   - Nếu từ khóa khớp với bất kỳ trường nào ➔ Trả về danh sách chứa thông tin đó.
   - Nếu từ khóa **KHÔNG tồn tại** (ví dụ gõ `"abcdef"`) ➔ Trả về danh sách rỗng (`content: []`), Frontend hiển thị giao diện **`No data available.`**.

---

### 🔄 LUỒNG 5: Vô Hiệu Hóa (Xóa Mềm), Khôi Phục & Xóa Vĩnh Viễn (Soft Delete, Restore & Force Delete)

```
Xóa mềm ➔ set INACTIVE (Bảo lưu dữ liệu)
Khôi phục ➔ set ACTIVE
Xóa vĩnh viễn ➔ DELETE SQL (Bắt lỗi Constraint Violation nếu có Booking)
```

1. **Xóa mềm (Soft Delete - `DELETE /api/v1/customers/{id}`)**:
   - Lễ tân bấm icon Xóa. Service gán `customer.setStatus(AccountStatus.INACTIVE)` và lưu DB.
   - Dữ liệu bị ẩn khỏi bảng hoạt động nhưng lịch sử Đặt phòng & Hóa đơn cũ vẫn được bảo lưu để làm báo cáo tài chính.
2. **Khôi phục (Restore - `PUT /api/v1/customers/{id}/restore`)**:
   - Chuyển lọc trạng thái sang `INACTIVE`, bấm icon Khôi phục. Service gán `customer.setStatus(AccountStatus.ACTIVE)`.
3. **Xóa vĩnh viễn (Force Delete - `DELETE /api/v1/customers/{id}/force`)**:
   - Chỉ dùng cho dữ liệu rác/nhập sai chưa từng có giao dịch.
   - Code trong [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java#L198-L212):
     ```java
     try {
         customerRepository.delete(customer);
         customerRepository.flush(); // Ép thực thi DELETE SQL ngay lập tức
     } catch (DataIntegrityViolationException e) {
         throw new ConflictException(
             messageSource.getMessage("error.customer.cannot_delete_has_history", null, locale)
         );
     }
     ```
   - Nếu khách hàng đã từng phát sinh Đặt phòng (khóa ngoại `customer_id` trong bảng `bookings`), DB sẽ ném lỗi Foreign Key Violation. Service bắt `DataIntegrityViolationException` và ném lỗi `ConflictException` hiển thị thông báo rõ ràng: *"Không thể xóa vĩnh viễn khách hàng đã có lịch sử đặt phòng!"*.

---

## IV. BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN & HƯỚNG DẪN CODE LIVE CHI TIẾT (DEFENSE QA & LIVE CODING EXAMPLES)

---

### ❓ CÂU 1: "Làm sao phân quyền để Khách hàng tự cập nhật được profile của mình nhưng KHÔNG THỂ sửa profile của khách hàng khác?"

#### 📍 Vị trí Code:
Dòng 91 tại [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java#L91):

```java
@PutMapping("/{id}")
@PreAuthorize("hasAuthority('CUSTOMER_UPDATE') or (hasRole('CUSTOMER') and #customerCreateDTO.email == authentication.name)")
public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
        @Valid @RequestBody CustomerCreateDTO customerCreateDTO,
        @PathVariable Long id){ ... }
```

#### 💡 Giải thích Cơ chế:
- Lễ tân có authority `CUSTOMER_UPDATE` ➔ Mệnh đề 1 `true` ➔ Sửa được ai cũng được.
- Khách hàng có Role `CUSTOMER` ➔ Mệnh đề 2 kích hoạt: So sánh `authentication.name` (Email trích xuất từ JWT Token đăng nhập) với `#customerCreateDTO.email` (Email truyền trong Body). Nếu trùng khớp mới cho phép sửa.

---

### ❓ CÂU 2: "Thầy/Cô muốn bổ sung trường `passportNumber` (Hộ chiếu) và `vipLevel` (Cấp VIP) cho Khách hàng. Hãy thực hiện Live Coding ngay trên máy."

#### 🛠️ Hướng Dẫn Thực Hiện 5 Bước:

1. **Bước 1 (Entity)** [Customer.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/entity/customer/Customer.java):
   ```java
   @Column(name = "passport_number") private String passportNumber;
   @Column(name = "vip_level") private String vipLevel;
   ```
2. **Bước 2 (Request DTO)** [CustomerCreateDTO.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/request/CustomerCreateDTO.java):
   ```java
   private String passportNumber;
   private String vipLevel;
   ```
3. **Bước 3 (Response DTO)** [CustomerResponse.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/response/CustomerResponse.java):
   ```java
   private String passportNumber;
   private String vipLevel;
   ```
4. **Bước 4 (Service Impl)** [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java):
   Gán `customer.setPassportNumber(dto.getPassportNumber())` và `customer.setVipLevel(dto.getVipLevel())`.
5. **Bước 5 (Frontend React)** [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx):
   Thêm thuộc tính vào state `EMPTY`, thêm cột vào bảng `cols`, thêm ô hiển thị dữ liệu `rows` và thêm `<input>` vào Form Modal.
