# 📘 Hướng Dẫn Chi Tiết Chuyên Sâu: Nghiệp Vụ, Luồng Hoạt Động Frontend ➔ Backend & Kịch Bản Bảo Vệ Quản Lý Khách Hàng (Customer Management)

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
| **Frontend UI** | [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx) | Màn hình React hiển thị bảng `DataTable`, Modal form thêm/sửa, Debounce 300ms tìm kiếm và Client Validation. |
| **Frontend Service** | `customerService.js` (`frontend/src/services`) | Gọi hàm wrapper `apiFetch` truyền tham số URL Query / Body JSON và Header JWT Token xuống Backend. |
| **Controller** | [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java) | Tiếp nhận REST API `/api/v1/customers`, kiểm tra phân quyền Spring Security SpEL `@PreAuthorize`. |
| **Service Interface** | `CustomerService.java` | Khai báo các phương thức chuẩn cho nghiệp vụ khách hàng. |
| **Service Impl** | [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java) | Thực thi toàn bộ logic nghiệp vụ, quản lý Transaction `@Transactional`, kiểm tra trùng lặp email/phone/CCCD, xử lý xóa mềm & xóa vĩnh viễn. |
| **Repository** | [CustomerRepository.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/repository/customer/CustomerRepository.java) | Tương tác DB qua JPQL. Thực thi câu truy vấn tìm kiếm đa tiêu chí `searchCustomer`. |
| **Request DTO** | [CustomerCreateDTO.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/dto/customer/request/CustomerCreateDTO.java) | Chứa thuộc tính dữ liệu gửi từ Client và Bean Validation (`@NotBlank`, `@Pattern`, `@Email`). |
| **Response DTO** | [CustomerResponse.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/dto) | Format dữ liệu trả về cho Frontend. |

---

## III. CHI TIẾT 5 LUỒNG NGHIỆP VỤ TỪ FRONTEND ĐẾN BACKEND (END-TO-END WORKFLOWS)

```
┌─────────────────────────┐          HTTP Request          ┌─────────────────────────┐          JPQL / SQL          ┌─────────────────────────┐
│   FRONTEND (React UI)   │ ────────────────────────────>  │    BACKEND (Spring Boot) │ ───────────────────────────>  │   DATABASE (PostgreSQL) │
│   CustomerManager.jsx   │ <────────────────────────────  │   Controller ➔ Service  │ <───────────────────────────  │    Table: customers     │
└─────────────────────────┘          JSON Response         └─────────────────────────┘          Data Rows             └─────────────────────────┘
```

---

### 🔄 LUỒNG 1: Xem & Tự Cập Nhật Profile Cá Nhân (Self-Service Profile Flow)

#### 🎨 **Phía Frontend**:
1. **Khách hàng** (Role: `CUSTOMER`) đăng nhập và vào trang Tài khoản hệ thống (`/account`).
2. Màn hình [AccountInfo.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/AccountInfo.jsx) hiển thị thông tin gồm 2 phần: **System Account** (từ `users`) và **Customer Profile** (từ `customers`).
3. Khách hàng bấm **"Chỉnh sửa"** (chỉ cho phép sửa `Họ và tên`, `Số điện thoại`, `Quốc tịch` — cấm sửa `Email` và `Số giấy tờ`).
4. **Client-Side Validation**: Kiểm tra realtime các lỗi trống, sai định dạng.
5. Khi form hợp lệ, khách bấm **"Lưu thay đổi"** ➔ Gọi `updateCustomer(id, payload, locale)` trong `customerService.js`.
6. `customerService.js` sử dụng `apiFetch` tạo HTTP Request:
   - **Method**: `PUT`
   - **URL**: `/api/v1/customers/{id}`
   - **Headers**: `Authorization: Bearer <token_jwt>`
   - **Body**: Payload chứa thông tin vừa sửa.
   - **📝 Chi tiết Code sửa đổi (`AccountInfo.jsx`)**:
     ```javascript
     const loadProfile = useCallback(async () => {
       // ...
       // Gọi song song 2 API để lấy data mới nhất của cả User và Customer
       const [userRes, customerRes] = await Promise.all([
         refreshCurrentUser(),           // Gọi GET /api/v1/auth/me
         getMyCustomerProfile(locale),   // Gọi GET /api/v1/customers/me
       ]);
       // Cập nhật State
       setProfile(userRes?.data || user); 
       if (customerRes?.data) setCustomerProfile(customerRes.data);
     }, [...]);
     
     const handleSave = async (e) => {
       // ...
       // Gọi API cập nhật thông tin Customer
       await updateCustomer(customerProfile.id, {
         fullName: form.fullName.trim(),
         phone: form.phone.trim(),
         nationality: form.nationality.trim(),
         idType: form.idType,
         idNumberCard: form.idNumberCard,
         email: form.email,
       }, locale);
       // ...
       // Sau khi cập nhật xong, gọi lại hàm loadProfile để reload cả 2 bảng
       await loadProfile();
     };
     ```

#### ⚙️ **Phía Backend (Bảo mật & Đồng bộ Kép)**:
1. **Controller**: [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java) tiếp nhận request `PUT /api/v1/customers/{id}`.
2. **Security Evaluation**: Spring Security kích hoạt SpEL:
   ```java
   @PreAuthorize("hasAuthority('CUSTOMER_UPDATE') or (hasRole('CUSTOMER') and #customerCreateDTO.email == authentication.name)")
   ```
   - Spring Security giải mã JWT Token, trích xuất `authentication.name` (Email đăng nhập).
   - So sánh email trong Body `#customerCreateDTO.email` với `authentication.name`. Trùng khớp ➔ Đi tiếp. Sai lệch ➔ `403 Forbidden`.
3. **Service Impl**: [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java) thực thi:
   - **Double Duplicate Check (Kiểm tra trùng lặp 2 lớp)**:
     - *Lớp 1 (Bảng customers)*: Kiểm tra SĐT/CCCD mới có bị khách hàng khác chiếm không.
     - *Lớp 2 (Bảng users)*: Lấy Email dò sang bảng `users`, kiểm tra SĐT mới có bị User khác đăng ký không.
     - Vi phạm ➔ Ném `ConflictException` (HTTP 409).
   - **Đồng bộ Dữ liệu (Auto-Sync)**:
     - Tự động chép đè `Họ và tên` và `Số điện thoại` mới từ payload sang thực thể `User`.
     - Gọi `userRepository.save(user)` để đồng bộ dữ liệu Hệ thống.
   - **Cập nhật Customer**:
     - Gọi `customerMapper.updateCustomerFromDto` và `customerRepository.save(customer)`.
   - **📝 Chi tiết Code sửa đổi (`CustomerServiceImpl.java`)**:
     ```java
     // Đồng bộ dữ liệu sang bảng users nếu tồn tại account gắn với email này
     userRepository.findUserByEmail(customer.getEmail()).ifPresent(user -> {
         // Lớp 2: Kiểm tra trùng phone ở bảng users (ngoại trừ user hiện tại)
         if (!user.getPhone().equals(dto.getPhone()) && userRepository.existsByPhoneAndIdNot(dto.getPhone(), user.getId())) {
             throw new ConflictException(
                     messageSource.getMessage("error.phone.existed", new Object[]{dto.getPhone()}, locale)
             );
         }
         // Lớp 2: Kiểm tra trùng email ở bảng users (ngoại trừ user hiện tại)
         if (!user.getEmail().equals(dto.getEmail()) && userRepository.existsByEmailAndIdNot(dto.getEmail(), user.getId())) {
             throw new ConflictException(
                     messageSource.getMessage("error.email.existed", new Object[]{dto.getEmail()}, locale)
             );
         }
         // Ghi đè thông tin mới sang User entity
         user.setFullName(dto.getFullName());
         user.setPhone(dto.getPhone());
         user.setEmail(dto.getEmail());
         userRepository.save(user); // Lưu đồng bộ xuống bảng users
     });
     ```
4. **Trả về Response**: Controller trả về HTTP 200 OK.

#### 🔄 **Phản hồi lại Frontend**:
1. Frontend nhận HTTP 200 OK.
2. Hiển thị **Toast notification** thông báo *"Cập nhật thông tin thành công!"*.
3. Màn hình tự động thoát chế độ Edit và gọi lại hàm `loadProfile()`.
4. Hàm `loadProfile()` sử dụng `Promise.all` để chạy ngầm 2 tác vụ: gọi `refreshCurrentUser()` (gọi API `GET /api/v1/auth/me`) và gọi `getMyCustomerProfile()` (gọi API `GET /api/v1/customers/me`).
5. Nhờ Backend đã tự động đồng bộ (Auto-Sync) ➔ Dữ liệu hiển thị ở phần **System Account** lập tức trùng khớp hoàn toàn với **Customer Profile** ngay trên giao diện mà không bị lệch.

---

### 🔄 LUỒNG 2: Lễ Tân Tạo Khách Hàng Vãng Lai Tại Quầy (Walk-In Guest Flow)

#### 🎨 **Phía Frontend**:
1. Lễ tân vào màn hình [CustomerManager.jsx](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/frontend/src/components/CustomerManager.jsx), bấm nút **"+ Add Customer"**.
2. React mở Modal chứa Form nhập thông tin.
3. **Client-Side Validation (Realtime)**: Khi gõ vào ô nhập liệu, hàm `validateField(name, value)` kiểm tra lập tức:
   - `fullName`: Không được trống, không chứa khoảng trắng thừa ở đầu/cuối (`/^\s|\s$/`).
   - `phone`: Đúng 10 chữ số bắt đầu bằng số 0 (`/^0[0-9]{9}$/`).
   - `idNumberCard`: Từ 6-20 ký tự chữ/số/dấu gạch (`/^[A-Za-z0-9\-]{6,20}$/`).
4. Nếu có trường bị lỗi ➔ Hiển thị chữ đỏ ngay bên dưới ô nhập liệu và chặn không cho bấm Submit.
5. Khi form hợp lệ, Lễ tân bấm **"Lưu"** ➔ Gọi `createCustomer(payload, locale)` trong `customerService.js` ➔ `apiFetch('/customers', { method: 'POST', body: JSON.stringify(payload) })`.
   - **📝 Chi tiết Code sửa đổi (`CustomerManager.jsx`)**:
     ```javascript
     const handleSave = async (e) => {
       e.preventDefault();
       // ... Validate form ...
       setSaving(true);
       try {
         if (!currentId) {
           // Lễ tân tạo mới khách hàng vãng lai
           await createCustomer({ ...form }, locale);
           notify('Thêm khách hàng thành công!', 'success');
         } else {
           // Cập nhật khách hàng
           await updateCustomer(currentId, { ...form }, locale);
           notify('Cập nhật thành công!', 'success');
         }
         closeModal();
         fetchData(page); // Tải lại bảng dữ liệu
       } catch (err) { ... }
     };
     ```

#### ⚙️ **Phía Backend**:
1. **Controller**: [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java#L78) nhận request `POST /api/v1/customers`.
2. **Server-Side Validation**: Spring Boot kiểm tra `@Valid @RequestBody CustomerCreateDTO`. Nếu vi phạm các annotation `@NotBlank`, `@Email`, `@Pattern` ➔ Spring tự động trả về `400 Bad Request`.
3. **Service Impl**: [CustomerServiceImpl.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/service/customer/impl/CustomerServiceImpl.java#L88-L98):
   - Kiểm tra `customerRepository.existsByPhone(phone)` và `existsByIdNumberCard(idCard)`.
   - Nếu bị trùng ➔ Ném `ConflictException("error.phone.existed" / "error.idCard.existed")` (HTTP 409).
   - Nếu không trùng ➔ Chuyển DTO thành Entity `Customer`, gán `status = AccountStatus.ACTIVE`.
   - Gọi `customerRepository.save(customer)` thực thi câu lệnh SQL `INSERT INTO customers...`.
   - **📝 Chi tiết Code sửa đổi (`CustomerServiceImpl.java`)**:
     ```java
     // 1. Kiểm tra trùng số điện thoại
     if (customerRepository.existsByPhone(customerDTO.getPhone())) {
         throw new ConflictException(messageSource.getMessage("error.phone.existed", new Object[]{customerDTO.getPhone()}, locale));
     }
     // 2. Kiểm tra trùng CCCD
     if (customerRepository.existsByIdNumberCard(customerDTO.getIdNumberCard())) {
         throw new ConflictException(messageSource.getMessage("error.idCard.existed", new Object[]{customerDTO.getIdNumberCard()}, locale));
     }
     // 3. Khởi tạo và Lưu dữ liệu
     Customer customer = customerMapper.toEntity(customerDTO);
     customer.setStatus(AccountStatus.ACTIVE); // Mặc định ACTIVE
     Customer savedCustomer = customerRepository.save(customer);
     ```
4. **Trả về Response**: Controller trả về `ResponseEntity.status(201).body(ApiResponse(true, "Thêm thành công", customerResponse, 201))`.

#### 🔄 **Phản hồi lại Frontend**:
1. Frontend nhận response `HTTP 201 Created`.
2. Đóng Modal Form (`closeModal()`).
3. Hiển thị **Toast thông báo** *"Thêm khách hàng mới thành công!"*.
4. Tự động gọi `fetchData(page)` để load lại danh sách, cập nhật dòng dữ liệu mới lên bảng `DataTable`.

---

### 🔄 LUỒNG 3: Tự Động Đồng Bộ Khách Hàng Cũ Khi Đặt Phòng (Re-Booking Auto-Sync Flow)

**💡 Hoàn cảnh thực tế (Business Case):**
Trong thực tế khách sạn, một khách hàng (ví dụ anh A) đến ở vào tháng 1 và đã được lưu vào hệ thống. Đến tháng 5, anh A quay lại đặt phòng. 
- Lễ tân (hoặc chính anh A đặt online) nhập lại Email cũ vào form Tạo Khách Hàng / Đặt Phòng. 
- Theo logic thông thường của API `POST /customers` (Tạo mới), nếu thấy Email đã tồn tại trong Database, hệ thống sẽ ném lỗi 409 đỏ chót: *"Email đã tồn tại!"*. 
- Điều này khiến luồng Đặt phòng bị đứt đoạn, Lễ tân bị kẹt lại không tạo được Booking tiếp theo.

**✅ Giải pháp của hệ thống:** Thay vì chửi lỗi, Backend sẽ **"Nhận diện khách cũ"**. Nó tự động lấy Hồ sơ cũ của anh A ra, xem đợt này anh A có đổi Số điện thoại hay đổi CCCD mới không. Nếu có thì tự động cập nhật ẩn ở dưới (Auto-Sync) rồi trả về dữ liệu thành công để Lễ tân làm Booking tiếp mà không hề bị báo lỗi.

#### 🎨 **Phía Frontend**:
1. Khách cũ quay lại đặt phòng hoặc Lễ tân nhập thông tin khách cũ (có Email đã tồn tại) vào Form.
2. Frontend ngầm gửi request `POST /api/v1/customers` với hy vọng tạo mới khách hàng để lấy ID gắn vào Booking.

#### ⚙️ **Phía Backend (Xử lý thông minh)**:
1. **Service Impl**: `CustomerServiceImpl.java` phát hiện `customerRepository.existsByEmail(dto.getEmail()) == true`.
2. **Xử lý nghiệp vụ thông minh**: Thay vì trả lỗi *"Email đã tồn tại"* gây đứt đoạn luồng đặt phòng, Service thực thi:
   - Tìm khách hàng trong DB: `customerRepository.findByEmailAndStatus(dto.getEmail(), AccountStatus.ACTIVE)`.
   - So sánh thông tin mới truyền lên với thông tin cũ (`fullName`, `phone`, `idNumberCard`, `idType`, `nationality`).
   - Nếu có thông tin mới thay đổi (ví dụ đổi SĐT hoặc đổi CCCD) ➔ Cập nhật thông tin mới nhất và gọi `customerRepository.save(customer)`.
   - **📝 Chi tiết Code sửa đổi (`CustomerServiceImpl.java`)**:
     ```java
     // Chặn luồng lỗi 409 khi email tồn tại, thay vào đó thực hiện Đồng bộ (Auto-Sync)
     if (customerRepository.existsByEmail(customerDTO.getEmail())) {
         Customer customer = customerRepository.findByEmailAndStatus(customerDTO.getEmail(), AccountStatus.ACTIVE)
                 .orElseThrow(() -> new ConflictException(messageSource.getMessage("error.email.existed", new Object[]{customerDTO.getEmail()}, locale)));

         boolean isUpdated = false;
         // Kiểm tra nếu tên thay đổi
         if (!customer.getFullName().equals(customerDTO.getFullName())) {
             customer.setFullName(customerDTO.getFullName());
             isUpdated = true;
         }
         // ... Tương tự cho phone, idNumberCard, nationality ...
         
         if (isUpdated) {
             customer = customerRepository.save(customer);
             log.info("[CustomerSync] Cập nhật thông tin tự động cho Email: {}", customerDTO.getEmail());
         }
         return customerMapper.toResponse(customer);
     }
     ```
3. **Trả về Response**: Trả về `CustomerResponse` của chính khách hàng cũ đó kèm các thông tin vừa được cập nhật.

#### 🔄 **Phản hồi lại Frontend**:
1. Frontend nhận thông tin `Customer` mà không bị gián đoạn lỗi.
2. Hệ thống tự động lấy `customer.id` để tiếp tục thực hiện luồng tạo Đặt phòng (`Booking`) tiếp theo.

---

### 🔄 LUỒNG 4: Tìm Kiếm & Phân Trang Đa Tiêu Chí (Search & Pagination Flow)

#### 🎨 **Phía Frontend**:
1. Lễ tân gõ từ khóa vào ô tìm kiếm (ví dụ: `"Johnson"`, `"0904"`, `"Việt Nam"`, `"00109"`) hoặc chọn trạng thái (`ACTIVE`, `INACTIVE`, `BANNED`).
2. **Debounce 300ms**: Sử dụng `setTimeout` 300ms. Khi dừng gõ 300ms ➔ Tự động gọi `fetchData(0)`.
   - **📝 Chi tiết Code sửa đổi (`CustomerManager.jsx`)**:
     ```javascript
     // Debounce 300ms bằng useEffect
     useEffect(() => {
       const timer = setTimeout(() => {
         fetchData(page);
       }, 300);
       // Hủy bỏ lần chạy trước đó nếu người dùng đang gõ dở
       return () => clearTimeout(timer);
     }, [page, search, statusFilter, fetchData]);
     ```
3. `fetchDataDirect` chuẩn bị tham số `{ page: 0, size: 10, status, keyword: trimmed }`.
4. Gọi `getCustomers(params, locale)` trong `customerService.js` ➔ Gửi HTTP Request `GET /api/v1/customers?page=0&size=10&status=ACTIVE&keyword=...`.

#### ⚙️ **Phía Backend**:
1. **Controller**: [CustomerController.java](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/src/main/java/com/hms/controller/customer/CustomerController.java#L46-L53) nhận các parameter `@RequestParam`.
2. **Service Impl**: bọc ký tự đại diện `%`:
   ```java
   String searchKeyword = (keyword != null && !keyword.trim().isEmpty())
           ? "%" + keyword.trim() + "%"
           : null;
   ```
3. **Repository**: thực thi câu JPQL Query:
   - **📝 Chi tiết Code sửa đổi (`CustomerRepository.java`)**:
     ```java
     @Query("""
         SELECT c FROM Customer c
         WHERE (:status IS NULL OR c.status = :status)
         AND (
             CAST(:keyword AS string) IS NULL
             OR LOWER(c.fullName) LIKE LOWER(CAST(:keyword AS string))
             OR LOWER(c.email) LIKE LOWER(CAST(:keyword AS string))
             OR c.phone LIKE CAST(:keyword AS string)
             OR c.idNumberCard LIKE CAST(:keyword AS string)
             OR LOWER(c.nationality) LIKE LOWER(CAST(:keyword AS string))
         )
     """)
     Page<Customer> searchCustomers(@Param("keyword") String keyword, @Param("status") AccountStatus status, Pageable pageable);
     ```
4. **Trả về Response**: Spring Data JPA trả về đối tượng `Page<Customer>` ➔ Service map sang `Page<CustomerResponse>` ➔ Controller trả về HTTP 200 OK.

#### 🔄 **Phản hồi lại Frontend**:
1. Trong `CustomerManager.jsx`, hàm `fetchDataDirect` nhận JSON response chứa dữ liệu phân trang.
2. Hàm này lập tức cập nhật state thông qua `setItems` và `setTotalPages`.
   - **📝 Chi tiết Code sửa đổi (`CustomerManager.jsx`)**:
     ```javascript
     const fetchDataDirect = useCallback(async (p, opt, val, statusVal = statusFilter) => {
       // ... gọi API getCustomers ...
       const res = await getCustomers(params, locale);
       
       // Nhận dữ liệu phân trang và cập nhật State để re-render
       setItems(res?.data?.content ?? []);
       setTotalPages(res?.data?.totalPages ?? 1);
     }, [...]);
     ```
3. Bảng `DataTable` tự động nhận State mới và re-render:
   - **Nếu tìm thấy**: Hiển thị danh sách kết quả khớp từ khóa.
   - **Nếu KHÔNG tìm thấy** (gõ từ khóa không tồn tại) ➔ `content` rỗng ➔ Bảng hiển thị chữ **`No data available.`**

---

### 🔄 LUỒNG 5: Vô Hiệu Hóa (Xóa Mềm), Khôi Phục & Xóa Vĩnh Viễn (Soft Delete, Restore & Force Delete)

#### 🔴 **Nhánh 5A: Xóa Mềm (Soft Delete)**
1. **Frontend**: Lễ tân bấm icon Thùng rác bên cạnh hàng dữ liệu ➔ Gọi `handleDelete(item)` ➔ Gọi `deleteCustomer(id, locale)` ➔ Gửi `DELETE /api/v1/customers/{id}`.
2. **Backend**: Controller gọi `CustomerServiceImpl.deleteCustomer(id)` ➔ Tìm customer ➔ Gán `customer.setStatus(AccountStatus.INACTIVE)` ➔ Gọi `customerRepository.save(customer)`.
3. **Phản hồi Frontend**: Nhận HTTP 200 OK ➔ Toast thông báo *"Xóa mềm thành công"* ➔ `fetchData(page)` load lại bảng (dữ liệu ẩn khỏi tab `ACTIVE`).

#### 🟢 **Nhánh 5B: Khôi Phục (Restore)**
1. **Frontend**: Lễ tân chọn lọc trạng thái `INACTIVE` ➔ Bấm icon Khôi phục (`RefreshCw`) ➔ Gọi `handleRestore(item)` ➔ Gửi `PUT /api/v1/customers/{id}/restore`.
2. **Backend**: Controller gọi `CustomerServiceImpl.restoreCustomer(id)` ➔ Gán `customer.setStatus(AccountStatus.ACTIVE)` ➔ Gọi `customerRepository.save(customer)`.
3. **Phản hồi Frontend**: Nhận HTTP 200 OK ➔ Toast *"Khôi phục tài khoản thành công"* ➔ Bảng tự động cập nhật.

#### ❌ **Nhánh 5C: Xóa Vĩnh Viễn (Force Delete)**
1. **Frontend**: Trong tab `INACTIVE`, Lễ tân bấm icon Thùng rác lần 2 để xác nhận xóa vĩnh viễn ➔ Gọi `handleForceDelete(item)` ➔ Gửi `DELETE /api/v1/customers/{id}/force`.
2. **Backend**: Controller gọi `CustomerServiceImpl.forceDeleteCustomer(id)`:
   - **📝 Chi tiết Code sửa đổi (`CustomerServiceImpl.java`)**:
     ```java
     public void forceDeleteCustomer(Long id) {
         Customer customer = customerRepository.findByIdAndStatus(id, AccountStatus.INACTIVE)
             .orElseThrow(() -> new ResourceNotFoundException("Customer not found or not inactive"));
         try {
             customerRepository.delete(customer);
             // Ép Hibernate thực thi câu DELETE ngay xuống Database
             customerRepository.flush(); 
         } catch (DataIntegrityViolationException e) {
             // Lỗi Constraint Violation do khóa ngoại từ bảng Bookings
             throw new ConflictException(
                 messageSource.getMessage("error.customer.cannot_delete_has_history", null, locale)
             );
         }
     }
     ```
3. **Xử lý Vi phạm Khóa Ngoại**:
   - Nếu khách hàng đã từng có Đặt phòng (`Booking`), bảng `bookings` chứa khóa ngoại `customer_id` ➔ DB ném lỗi Constraint Violation.
   - Backend catch `DataIntegrityViolationException` ➔ Ném `ConflictException` (HTTP 409).
4. **Phản hồi Frontend**:
   - **Nếu không có lịch sử**: Nhận HTTP 200 OK ➔ Toast *"Xóa hoàn toàn khỏi hệ thống thành công"*.
   - **Nếu có lịch sử**: Nhận HTTP 409 ➔ Toast màu đỏ hiển thị thông báo lỗi rõ ràng: *"Không thể xóa vĩnh viễn khách hàng đã có lịch sử đặt phòng!"*.

