<!-- ============================================================================
     QUICK REFERENCE: HTML Screens Implementation Card
     ============================================================================ -->

# 🚀 QUICK REFERENCE - HMS Screens Implementation

## 📍 File Locations

```
✅ COMPLETE FILES (Use These):
  src/main/resources/templates/pages/customer/customer-list-complete.html
  src/main/resources/templates/pages/hotel/room-type-complete.html
  src/main/resources/templates/pages/hotel/room-list-complete.html
  src/main/resources/templates/pages/equipment/equip-list-complete.html

📝 DOCUMENT:
  IMPLEMENTATION_GUIDE.md (This file location)

📦 FRAGMENTS (Already Exist - Don't Modify):
  src/main/resources/templates/fragments/header.html
  src/main/resources/templates/fragments/footer.html
```

---

## 🎯 What Each Screen Does

| Screen | Location | Features | Modal Forms |
|--------|----------|----------|-------------|
| **Customer List** | `/customers` | Search, table, stats, CRUD | Add/Edit Customer |
| **Room Types** | `/room-types` | Grid cards, amenities, price | Add/Edit Room Type, Update Price |
| **Room List** | `/rooms` | Floor matrix, color status | Room Details, Add Room |
| **Equipment** | `/equipments` | Table, status badges, stats | Report Damage, Add Equipment |

---

## 🔄 Model Attributes to Pass from Controller

```java
// CustomerController
model.addAttribute("customers", Page<CustomerResponse>);
model.addAttribute("keywords", String);
model.addAttribute("status", String);
model.addAttribute("activeCount", Integer);
model.addAttribute("newCustomersCount", Integer);
model.addAttribute("domesticCount", Integer);

// RoomTypeController
model.addAttribute("roomTypes", List<RoomTypeResponse>);
model.addAttribute("roomType", RoomTypeRequest);

// RoomController
model.addAttribute("rooms", List<Room>);
model.addAttribute("roomsByFloor", Map<Integer, List<Room>>);
model.addAttribute("floors", Collection<Integer>);
model.addAttribute("roomTypes", List<RoomTypeResponse>);
model.addAttribute("availableFloors", List<Integer>);

// EquipmentController
model.addAttribute("equipments", Page<EquipmentResponse>);
model.addAttribute("goodCount", Integer);
model.addAttribute("brokenCount", Integer);
model.addAttribute("maintenanceCount", Integer);
```

---

## 🔗 Required API Endpoints

### Customer API
```
POST   /api/v1/customers              → Create customer
GET    /api/v1/customers/{id}         → Get customer
PUT    /api/v1/customers/{id}         → Update customer
DELETE /api/v1/customers/{id}         → Delete customer
```

### Room Type API
```
POST   /api/v1/room-types             → Create room type
GET    /api/v1/room-types/{id}        → Get room type
PUT    /api/v1/room-types/{id}        → Update room type
DELETE /api/v1/room-types/{id}        → Delete room type
POST   /api/v1/room-types/update-price → Update price only
```

### Room API
```
POST   /api/v1/rooms                  → Create room
GET    /api/v1/rooms/{id}             → Get room details
PUT    /api/v1/rooms/{id}             → Update room
DELETE /api/v1/rooms/{id}             → Delete room
```

### Equipment API
```
POST   /api/v1/equipments             → Create equipment
GET    /api/v1/equipments/{id}        → Get equipment
PUT    /api/v1/equipments/{id}        → Update equipment
DELETE /api/v1/equipments/{id}        → Delete equipment
POST   /api/v1/maintenance/report     → Report damage
```

---

## 📋 HTML Form Field Mappings

### Customer Form Fields
```html
<input th:field="*{id}">               <!-- Hidden -->
<input th:field="*{fullName}">         <!-- Text input -->
<input th:field="*{email}">            <!-- Email input -->
<input th:field="*{phone}">            <!-- Tel input -->
<select th:field="*{idType}">          <!-- Select dropdown -->
<input th:field="*{idNumberCard}">     <!-- Text input -->
<input th:field="*{nationality}">      <!-- Text input -->
```

### Room Type Form Fields
```html
<input th:field="*{id}">               <!-- Hidden -->
<input th:field="*{typeName}">         <!-- Text input -->
<textarea th:field="*{description}">   <!-- Textarea -->
<input th:field="*{basePrice}">        <!-- Number input -->
<input th:field="*{maxGuests}">        <!-- Number input -->
```

### Room Form Fields
```html
<input name="roomNumber">              <!-- Room number -->
<select name="floorNumber">            <!-- Floor selector -->
<select name="roomTypeId">             <!-- Room type selector -->
<select name="roomStatus">             <!-- Status selector -->
<textarea name="description">          <!-- Notes -->
```

### Equipment Form Fields
```html
<input name="equipmentName">           <!-- Equipment name -->
<input name="equipmentCode">           <!-- Serial/Code -->
<input name="location">                <!-- Location/Room -->
<textarea name="description">          <!-- Description -->
<select name="severity">               <!-- For damage report -->
<textarea name="diagnosis">            <!-- Damage description -->
```

---

## 🎨 Key CSS Classes Used

```css
/* Main Layout */
.hms-content                 /* Main content wrapper with top margin -->
.page-header                 /* Title section with button -->

/* Tables */
.hms-table-wrapper           /* Table container -->
.hms-table                   /* Table styling -->
.badge-status                /* Status badge -->

/* Cards */
.stat-card                   /* Statistics card -->
.room-card                   /* Room type card (Grid) -->
.floor-section               /* Floor layout section -->
.room-cell                   /* Individual room cell -->

/* Forms */
.form-control                /* Input styling -->
.form-select                 /* Select styling -->
.form-label                  /* Label styling -->
.modal-content               /* Modal styling -->

/* Colors/Status -->
.status-available            /* Blue - Available -->
.status-occupied             /* Red - Occupied -->
.status-cleaning             /* Orange - Cleaning -->
.status-maintenance          /* Gray - Maintenance -->
.status-good                 /* Green - Good -->
.status-minor                /* Yellow - Minor issue -->
.status-broken               /* Red - Broken -->

/* Buttons */
.btn-hms-primary             /* Primary button -->
.btn-hms-accent              /* Accent/Gold button -->
.btn-action                  /* Small action button -->
.page-btn                    /* Pagination button -->
```

---

## 🔐 Thymeleaf Attribute Syntax

```html
<!-- Th:action - Form submission -->
<form th:action="@{/api/v1/customers}" method="post">
<form th:action="@{/api/v1/customers/{id}(id=${customer.id})}" method="put">

<!-- Th:object - Form object binding -->
<form th:object="${customer}">

<!-- Th:field - Field binding -->
<input th:field="*{fullName}">
<input th:field="*{email}">

<!-- Th:value - Set value -->
<input th:value="${customer.fullName}">

<!-- Th:text - Display text -->
<span th:text="${customer.fullName}"></span>

<!-- Th:each - Loop -->
<tr th:each="customer : ${customers.content}">

<!-- Th:if/unless - Conditional -->
<div th:if="${customers.empty}">No data</div>

<!-- Th:classappend - Add CSS class conditionally -->
<div th:classappend="${status == 'ACTIVE'} ? 'active' : 'inactive'">

<!-- Th:replace - Include fragment -->
<div th:replace="~{fragments/header :: header(activeTab='customer')}"></div>
```

---

## 📱 Responsive Breakpoints

```css
Default: Desktop (all screens)
@media (max-width: 1024px) - Tablets
@media (max-width: 768px)  - Mobile landscape
@media (max-width: 480px)  - Mobile portrait

Grid layouts adjust automatically using:
grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))
```

---

## 🛠️ Common JavaScript Functions

### Toast Notification
```javascript
showToast('success', 'Title', 'Message');
showToast('error', 'Error', 'Something went wrong');
```

### Fetch API Call
```javascript
fetch('/api/v1/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => { /* handle response */ })
.catch(err => console.error(err));
```

### Modal Control
```javascript
// Open modal
new bootstrap.Modal(document.getElementById('modal')).show();
// Close modal (using Bootstrap 5)
const modal = bootstrap.Modal.getInstance(document.getElementById('modal'));
modal.hide();
```

---

## 📊 Database Fields by Module

### Customer Entity
- id, fullName, email, phone
- idType (ENUM), idNumberCard
- nationality, status (ENUM)
- createdAt

### RoomType Entity
- id, typeName, description
- basePrice, maxGuests
- status (ENUM)

### Room Entity
- id, roomNumber, roomType (FK)
- roomStatus (ENUM), floorNumber
- description

### Equipment Entity
- id, equipmentName, equipmentCode
- location, description
- status (ENUM), createdAt

---

## 🎯 Implementation Checklist

- [ ] Copy all 4 complete HTML files to project
- [ ] Create/Update Controller methods (pass model attributes)
- [ ] Create REST API endpoints for CRUD operations
- [ ] Test each endpoint with Postman
- [ ] Verify Thymeleaf syntax in templates
- [ ] Test modals: open, close, submit
- [ ] Test search/filter functionality
- [ ] Test pagination
- [ ] Test AJAX form submissions
- [ ] Verify toast notifications display
- [ ] Test on mobile devices
- [ ] Check console for JavaScript errors
- [ ] Verify all icons display (FontAwesome)
- [ ] Test dark theme consistency

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check Bootstrap JS is loaded, verify element IDs |
| Form fields empty | Ensure Model attributes passed from controller |
| Icons not showing | Check FontAwesome 6 CDN link is included |
| Styling inconsistent | Verify color variables and CSS classes match |
| API calls fail | Check endpoint path, method (POST/PUT/DELETE), headers |
| Search doesn't work | Ensure search parameter name matches controller |
| Pagination broken | Verify Page<T> object passed to model |

---

## 📞 Quick Contact

For questions about implementation:
1. Review IMPLEMENTATION_GUIDE.md for detailed info
2. Check browser console for JavaScript errors
3. Verify backend controller methods exist
4. Check API endpoint accessibility
5. Verify database models match DTOs

---

**Last Updated:** June 4, 2026
**Version:** 1.0 - Production Ready ✅


