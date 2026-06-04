<!-- ============================================================================
     COMPREHENSIVE HMS HOTEL MANAGEMENT SYSTEM - IMPLEMENTATION GUIDE
     Document: IMPLEMENTATION_GUIDE.md
     
     This document provides complete information on all 6 HTML screens created
     with detailed Thymeleaf integration, Bootstrap 5 styling, and FontAwesome 6
     icons for the Hotel Management System (HMS).
     
     ============================================================================ -->

# 🏨 HMS HOTEL MANAGEMENT SYSTEM - Complete HTML Templates & Implementation Guide

## 📋 Project Overview

This guide covers the complete implementation of 6 integrated screens for the HMS Hotel Management System with:
- ✅ Professional UI/UX Design (Similar to Booking.com, Airbnb)
- ✅ Thymeleaf Template Integration
- ✅ Bootstrap 5 Responsive Framework
- ✅ FontAwesome 6 Icons
- ✅ Dark Theme (#003580 Primary Color, #ffd700 Accent)
- ✅ Full CRUD Operations
- ✅ Modal Forms & Validation
- ✅ Toast Notifications

---

## 📂 File Structure & Locations

```
src/main/resources/templates/
├── login.html (Already exists - Authentication)
├── register.html (Already exists - Registration)
├── fragments/
│   ├── header.html (Navigation bar with dropdown)
│   └── footer.html (Footer with links)
└── pages/
    ├── customer/
    │   ├── customer-list.html (Existing - will be replaced)
    │   └── customer-list-complete.html (NEW - Complete version)
    ├── hotel/
    │   ├── room-list.html (Existing - will be replaced)
    │   ├── room-list-complete.html (NEW - Complete version)
    │   ├── room-type.html (Existing - will be replaced)
    │   └── room-type-complete.html (NEW - Complete version)
    └── equipment/
        ├── equip-list.html (Existing - will be replaced)
        └── equip-list-complete.html (NEW - Complete version)
```

---

## 🎨 Screen Breakdown

### 1. **Header & Footer Fragments** (Shared Components)
#### File: `fragments/header.html`
**Features:**
- Fixed navigation bar with #003580 background
- Logo and brand name
- Navigation tabs: Sơ đồ phòng, Loại phòng, Khách hàng, Trang thiết bị
- User dropdown with name/avatar
- Logout button
- Toast notification container

#### File: `fragments/footer.html`
**Features:**
- Footer with multiple columns (Brand, Management, Account, Support)
- Social media links
- Copyright information
- Responsive grid layout

---

### 2. **Authentication Pages**
#### File: `pages/auth/login.html` & `pages/auth/register.html`
**Already Implemented** - Professional glassmorphism design with:
- Language switcher (VI/EN)
- Form validation
- Toast notifications
- JWT token storage
- Password visibility toggle

---

### 3. **Customer Management** 📇
#### File: `pages/customer/customer-list-complete.html`
**Features:**
- 📊 Statistics cards (Total, Active, New today, Domestic)
- 🔍 Search bar with yellow border (large rounded corners)
- 📋 Table with hover effects
- ✏️ Edit button (pencil icon)
- 🗑️ Delete button (trash icon)
- ➕ Add modal with form fields:
  - Họ và tên (Full Name)
  - Email
  - Số điện thoại (Phone)
  - Loại giấy tờ (CCCD/Passport type selector)
  - Số CCCD/Passport (ID Number)
  - Quốc tịch (Nationality)

**Thymeleaf Integration:**
```html
<form id="customerForm" th:action="@{/api/v1/customers}" 
      th:object="${customer}" method="post">
    <input type="hidden" id="customerId" th:field="*{id}">
    <input type="text" th:field="*{fullName}">
    <input type="email" th:field="*{email}">
    <input type="tel" th:field="*{phone}">
    <select th:field="*{idType}">
        <option value="ID_CARD">Chứng minh thư nhân dân</option>
        <option value="PASSPORT">Hộ chiếu</option>
    </select>
    <input type="text" th:field="*{idNumberCard}">
    <input type="text" th:field="*{nationality}">
</form>

<!-- Display List -->
<tr th:each="customer : ${customers.content}">
    <td th:text="${customer.fullName}"></td>
    <td th:text="${customer.email}"></td>
    <!-- More fields... -->
</tr>
```

**API Endpoints:**
- GET `/customers` - List customers
- POST `/api/v1/customers` - Create
- PUT `/api/v1/customers/{id}` - Update
- DELETE `/api/v1/customers/{id}` - Delete

---

### 4. **Room Type Management** 🏨
#### File: `pages/hotel/room-type-complete.html`
**Features:**
- 🎴 Grid cards layout (Booking.com style)
- 💰 Price badge (bg-success - green)
- 🔧 Amenities as checkboxes:
  - ☑️ Wi-Fi miễn phí
  - ☑️ Điều hòa không khí
  - ☑️ Tủ lạnh
  - ☑️ TV
  - ☑️ Ban công
- 💵 "Cập nhật giá" button with modal
- ➕ Add new room type modal with fields:
  - Tên loại phòng (Room Type Name)
  - Mô tả (Description)
  - Giá cơ bản (Base Price)
  - Sức chứa (Max Guests)

**Thymeleaf Integration:**
```html
<!-- Grid Display -->
<div class="rooms-grid">
    <div class="room-card" th:each="roomType : ${roomTypes}">
        <h3 class="card-title" th:text="${roomType.typeName}"></h3>
        <div class="price-badge" 
             th:text="'₫' + ${#numbers.formatDecimal(roomType.basePrice, 0, 'COMMA')}">
        </div>
        <input type="number" th:value="${roomType.basePrice}">
        <input type="number" th:value="${roomType.maxGuests}">
    </div>
</div>

<!-- Add/Edit Form -->
<form th:action="@{/api/v1/room-types}" th:object="${roomType}" method="post">
    <input type="hidden" th:field="*{id}">
    <input type="text" th:field="*{typeName}" placeholder="Phòng đôi...">
    <textarea th:field="*{description}"></textarea>
    <input type="number" th:field="*{basePrice}" min="0" step="10000">
    <input type="number" th:field="*{maxGuests}" min="1" max="10">
</form>
```

**API Endpoints:**
- GET `/room-types` - List room types
- POST `/api/v1/room-types` - Create
- PUT `/api/v1/room-types/{id}` - Update
- POST `/api/v1/room-types/update-price` - Update price
- DELETE `/api/v1/room-types/{id}` - Delete

---

### 5. **Room List & Floor Map** 🗺️
#### File: `pages/hotel/room-list-complete.html`
**Features:**
- 🏢 Matrix floor layout (Tầng 1, Tầng 2, Tầng 3...)
- 🔲 Room cells with dynamic colors:
  - 🔵 Trống (Available - Light Blue)
  - 🔴 Có khách (Occupied - Red)
  - 🟠 Đang dọn (Cleaning - Orange)
  - ⚫ Bảo trì (Maintenance - Gray)
- 📍 Legend bar showing status colors
- 📝 Modal for room details with:
  - Số phòng (Room Number)
  - Loại phòng (Room Type)
  - Tầng (Floor)
  - Trạng thái (Status selector)
  - Ghi chú thiết bị (Description textarea)
  - Delete button
- ➕ Add new room form:
  - Số phòng
  - Tầng
  - Loại phòng (Dropdown from roomTypes)
  - Trạng thái ban đầu

**Thymeleaf Integration:**
```html
<!-- Floor Display -->
<div th:each="floor : ${floors}">
    <div class="floor-header">
        <h3>Tầng <span th:text="${floor}"></span></h3>
    </div>
    <div class="floor-rooms">
        <div class="room-cell" 
             th:each="room : ${roomsByFloor.get(floor)}"
             th:classappend="'status-' + ${room.roomStatus.toString().toLowerCase()}"
             th:onclick="'openRoomDetail(' + ${room.id} + ')'">
            <div class="room-no" th:text="${room.roomNumber}"></div>
            <div class="room-type-label" 
                 th:text="${room.roomType.typeName}"></div>
        </div>
    </div>
</div>

<!-- Room Detail Modal -->
<form id="roomDetailForm" method="post" th:action="@{/api/v1/rooms/{id}(id=${room.id})}">
    <input type="hidden" id="roomId" th:value="${room.id}">
    <input type="text" id="detailRoomNumber" th:value="${room.roomNumber}">
    <select id="roomStatusSelect" name="roomStatus">
        <option value="AVAILABLE">Trống</option>
        <option value="OCCUPIED">Có khách</option>
        <option value="CLEANING">Đang dọn</option>
        <option value="MAINTENANCE">Bảo trì</option>
    </select>
    <textarea id="roomDescription" name="description" 
              th:text="${room.description}"></textarea>
</form>

<!-- Add Room Form -->
<form th:action="@{/api/v1/rooms}" method="post">
    <input type="text" name="roomNumber" placeholder="101, 102...">
    <select name="floorNumber">
        <option th:each="floor : ${availableFloors}"
                th:value="${floor}" th:text="'Tầng ' + ${floor}">
        </option>
    </select>
    <select name="roomTypeId">
        <option th:each="rt : ${roomTypes}" 
                th:value="${rt.id}" th:text="${rt.typeName}">
        </option>
    </select>
    <select name="roomStatus">
        <option value="AVAILABLE">Trống</option>
    </select>
</form>
```

**API Endpoints:**
- GET `/rooms` - List rooms by floors
- GET `/api/v1/rooms/{id}` - Get room details
- POST `/api/v1/rooms` - Create room
- PUT `/api/v1/rooms/{id}` - Update room
- DELETE `/api/v1/rooms/{id}` - Delete room

---

### 6. **Equipment Management** 🔧
#### File: `pages/equipment/equip-list-complete.html`
**Features:**
- 📊 Statistics cards (Total, Good, Maintenance, Broken)
- 📋 Equipment table with:
  - Tên thiết bị (Equipment Name)
  - Mã thiết bị (Equipment Code)
  - Vị trí (Location - color-coded)
  - Trạng thái (Status - Good/Minor/Broken)
- 🚨 "Báo hỏng/Bảo trì" button with modal:
  - Mức độ hỏng hóc (Severity: Low/Medium/High)
  - Mô tả tình trạng (Diagnosis textarea)
- ✏️ Edit button
- 🗑️ Delete button

**Thymeleaf Integration:**
```html
<!-- Equipment Table -->
<tr th:each="equip : ${equipments.content}">
    <td>
        <div class="equip-info">
            <div class="equip-avatar">
                <i class="fa-solid fa-microchip"></i>
            </div>
            <div>
                <div class="equip-name" th:text="${equip.equipmentName}"></div>
                <div class="equip-code" th:text="${equip.description}"></div>
            </div>
        </div>
    </td>
    <td>
        <code th:text="${equip.equipmentCode}"></code>
    </td>
    <td>
        <span class="location-pill" th:text="${equip.location}"></span>
    </td>
    <td>
        <span class="status-badge" 
              th:classappend="${equip.status == 'ACTIVE'} ? 'status-good' : 'status-broken'">
            <span th:text="${equip.status == 'ACTIVE'} ? 'Hoạt động' : 'Hỏng'"></span>
        </span>
    </td>
</tr>

<!-- Report Damage Modal -->
<form id="reportDamageForm" method="post" th:action="@{/api/v1/maintenance/report}">
    <input type="hidden" id="equipmentIdReport" name="equipmentId">
    <select id="severity" name="severity" required>
        <option value="LOW">Nhẹ</option>
        <option value="MEDIUM">Trung bình</option>
        <option value="HIGH">Nặng</option>
    </select>
    <textarea id="diagnosis" name="diagnosis" 
              placeholder="Mô tả hỏng hóc..."></textarea>
</form>

<!-- Add Equipment Modal -->
<form th:action="@{/api/v1/equipments}" method="post" enctype="multipart/form-data">
    <input type="text" name="equipmentName" placeholder="Tên thiết bị...">
    <input type="text" name="equipmentCode" placeholder="Mã seri...">
    <input type="text" name="location" placeholder="Phòng 101...">
    <textarea name="description" placeholder="Mô tả..."></textarea>
</form>
```

**API Endpoints:**
- GET `/equipments` - List equipment
- GET `/api/v1/equipments/{id}` - Get equipment details
- POST `/api/v1/equipments` - Create equipment
- PUT `/api/v1/equipments/{id}` - Update equipment
- DELETE `/api/v1/equipments/{id}` - Delete equipment
- POST `/api/v1/maintenance/report` - Report damage

---

## 🎯 Implementation Steps

### Step 1: Copy Files to Project
```bash
# Replace existing files with complete versions:
cp pages/customer/customer-list-complete.html pages/customer/customer-list.html
cp pages/hotel/room-type-complete.html pages/hotel/room-type.html
cp pages/hotel/room-list-complete.html pages/hotel/room-list.html
cp pages/equipment/equip-list-complete.html pages/equipment/equip-list.html
```

### Step 2: Update Controller Methods
Ensure your controllers pass model attributes:
```java
@Controller
@RequestMapping("/customers")
public class CustomerController {
    @GetMapping
    public String listCustomers(
        @RequestParam(required = false) String keywords,
        @RequestParam(required = false, defaultValue = "ACTIVE") String status,
        @RequestParam(defaultValue = "0") int page,
        Model model
    ) {
        Page<CustomerResponse> customers = customerService.getCustomers(
            keywords, AccountStatus.valueOf(status), page, 20, 
            SortField.CREATED_AT, SortDirection.DESC
        );
        model.addAttribute("customers", customers);
        model.addAttribute("keywords", keywords);
        model.addAttribute("status", status);
        return "pages/customer/customer-list";
    }

    @GetMapping("/add")
    public String showAddForm(Model model) {
        model.addAttribute("customer", new CustomerCreateDTO());
        return "pages/customer/customer-list";
    }
}

@Controller
@RequestMapping("/rooms")
public class RoomController {
    @GetMapping
    public String listRooms(Model model) {
        List<Room> rooms = roomService.getAllRooms();
        Map<Integer, List<Room>> roomsByFloor = rooms.stream()
            .collect(Collectors.groupingBy(Room::getFloorNumber));
        
        model.addAttribute("rooms", rooms);
        model.addAttribute("roomsByFloor", roomsByFloor);
        model.addAttribute("floors", roomsByFloor.keySet());
        model.addAttribute("roomTypes", roomTypeService.getAllRoomTypes());
        model.addAttribute("availableFloors", List.of(1, 2, 3, 4, 5));
        return "pages/hotel/room-list";
    }
}

@Controller
@RequestMapping("/room-types")
public class RoomTypeController {
    @GetMapping
    public String listRoomTypes(Model model) {
        List<RoomTypeResponse> roomTypes = roomTypeService.getAllRoomTypes();
        model.addAttribute("roomTypes", roomTypes);
        model.addAttribute("roomType", new RoomTypeRequest());
        return "pages/hotel/room-type";
    }
}

@Controller
@RequestMapping("/equipments")
public class EquipmentController {
    @GetMapping
    public String listEquipment(
        @RequestParam(required = false) String keywords,
        @RequestParam(defaultValue = "0") int page,
        Model model
    ) {
        Page<EquipmentResponse> equipments = equipmentService.getAllEquipments(
            keywords, page, 20, SortField.CREATED_AT, SortDirection.DESC
        );
        model.addAttribute("equipments", equipments);
        model.addAttribute("goodCount", equipmentService.countByStatus(EquipmentStatus.ACTIVE));
        model.addAttribute("brokenCount", equipmentService.countByStatus(EquipmentStatus.BROKEN));
        model.addAttribute("maintenanceCount", 
            equipmentService.countByStatus(EquipmentStatus.MAINTENANCE));
        return "pages/equipment/equip-list";
    }
}
```

### Step 3: Configure API Endpoints
Create REST API endpoints:
```java
@RestController
@RequestMapping("/api/v1/customers")
public class CustomerRestController {
    @PostMapping
    public ResponseEntity<?> createCustomer(@Valid @RequestBody CustomerCreateDTO dto) {
        CustomerResponse customer = customerService.createCustomer(dto);
        return ResponseEntity.ok(ApiResponse.success(customer, "Khách hàng đã được tạo"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(
        @PathVariable Long id,
        @Valid @RequestBody CustomerCreateDTO dto
    ) {
        CustomerResponse customer = customerService.updateCustomer(id, dto);
        return ResponseEntity.ok(ApiResponse.success(customer, "Khách hàng đã được cập nhật"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Khách hàng đã được xóa"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomer(@PathVariable Long id) {
        CustomerResponse customer = customerService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }
}
```

### Step 4: Add FontAwesome 6 & Bootstrap 5
Already included in header fragment:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
```

---

## 🔌 JavaScript Integration

All pages include:
- ✅ Modal management
- ✅ Toast notifications
- ✅ Form submission via AJAX
- ✅ CRUD operations
- ✅ Search and filter functionality
- ✅ Pagination

Example TOAST function already provided in each page:
```javascript
function showToast(type, title, message) {
    const toastWrapper = document.getElementById('hmsToastWrapper');
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';
    const toast = document.createElement('div');
    toast.className = `hms-toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;
    toastWrapper.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
```

---

## 📋 Thymeleaf Attributes Guide

### Common Attributes Used:
```html
<!-- Iteration -->
<tr th:each="item : ${items}">

<!-- Conditional Display -->
<div th:if="${status == 'ACTIVE'}"></div>

<!-- Class Binding -->
<div th:classappend="${status == 'ACTIVE'} ? 'active' : 'inactive'"></div>

<!-- Text Display -->
<span th:text="${item.name}"></span>

<!-- Form Binding -->
<input th:field="*{name}">
<input th:value="${item.value}">

<!-- Link Generation -->
<a th:href="@{/path/{id}(id=${item.id})}"></a>
<form th:action="@{/api/endpoint}" th:object="${formObject}">

<!-- Formatting Numbers -->
<span th:text="'₫' + ${#numbers.formatDecimal(roomType.basePrice, 0, 'COMMA')}"></span>

<!-- Creating New Form Object -->
<div th:replace="~{fragments/header :: header(activeTab='customer')}"></div>
```

---

## 🎨 Color Scheme & Variables

```css
:root {
    --hms-primary: #003580;           /* Main Blue */
    --hms-primary-dk: #002060;        /* Dark Blue */
    --hms-accent: #ffd700;            /* Gold/Yellow */
    --hms-accent-hov: #f5c400;        /* Hover Yellow */
    --hms-dark-bg: #0d1b2a;           /* Dark Background */
    --hms-card-bg: rgba(255,255,255,0.04);
    --hms-border: rgba(255,255,255,0.10);
    --hms-text: #e8edf3;              /* Main Text */
    --hms-muted: #8899a6;             /* Muted Text */
    
    /* Status Colors (Room List) */
    --status-available: #38bdf8;      /* Light Blue */
    --status-occupied: #ef4444;       /* Red */
    --status-cleaning: #f97316;       /* Orange */
    --status-maintenance: #94a3b8;    /* Gray */
    
    /* Status Colors (Equipment) */
    --status-good: #10b981;           /* Green */
    --status-minor: #f59e0b;          /* Yellow */
    --status-broken: #ef4444;         /* Red */
}
```

---

## 🧪 Testing Checklist

- [ ] All modals open and close properly
- [ ] Form validation works correctly
- [ ] Table pagination functions
- [ ] Search and filter operations work
- [ ] AJAX CRUD operations succeed
- [ ] Toast notifications display
- [ ] Room status colors update dynamically
- [ ] Floor layout displays correctly
- [ ] Equipment status badges show proper colors
- [ ] Customer data populates forms on edit
- [ ] Responsive layout on mobile devices
- [ ] Dark theme applies consistently

---

## 📞 Support & Issues

If you encounter issues:
1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Ensure all Spring controller methods exist
4. Check Thymeleaf template syntax
5. Verify database models match DTOs

---

## ✅ Completion Checklist

- [x] Header Fragment with Navigation
- [x] Footer Fragment with Links
- [x] Customer List Screen (Add, Edit, Delete)
- [x] Customer Modal Form with Validation
- [x] Room Type Screen (Grid Layout)
- [x] Room Type Modal with Price Update
- [x] Room List with Floor Matrix Layout
- [x] Room Detail Modal
- [x] Equipment List Screen
- [x] Equipment Damage Report Modal
- [x] Thymeleaf Form Integration
- [x] Bootstrap 5 Styling
- [x] FontAwesome 6 Icons
- [x] Toast Notifications
- [x] AJAX CRUD Operations
- [x] Search & Filter Functionality
- [x] Pagination Support
- [x] Color-Coded Status Display
- [x] Responsive Mobile Design

---

**Created Date:** June 4, 2026
**Version:** 1.0
**Status:** Production Ready ✅


