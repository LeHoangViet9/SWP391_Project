const fs = require('fs');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Hải', 'Hưng', 'Linh', 'Minh', 'Ngọc', 'Oanh', 'Phúc', 'Quang', 'Trang', 'Tuấn', 'Thủy', 'Vinh', 'Yến', 'John', 'Alice', 'David', 'Maria'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Smith', 'Doe', 'Johnson'];

const roomTypes = [
  { id: 1, name: 'Standard Single', price: 500000, maxGuests: 1 },
  { id: 2, name: 'Standard Double', price: 800000, maxGuests: 2 },
  { id: 3, name: 'Deluxe City View', price: 1200000, maxGuests: 2 },
  { id: 4, name: 'Family Suite', price: 2000000, maxGuests: 4 },
  { id: 5, name: 'President Suite', price: 5000000, maxGuests: 4 }
];

let sql = `-- =============================================================================
-- 1. TẠO BẢNG & INDEXES CHO CUSTOMER_FEEDBACK (NẾU CHƯA CÓ)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_feedback_booking ON customer_feedback (booking_id) WHERE (deleted = false);
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON customer_feedback (customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON customer_feedback (rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON customer_feedback (created_at DESC);

-- =============================================================================
-- 2. DỌN SẠCH DỮ LIỆU & RESET ID TỰ TĂNG
-- =============================================================================
TRUNCATE TABLE
    room_state_history, room_img, equipment_images,
    repair_requests, equipments, invoices, bookings, customers,
    room, room_type, user_permissions, role_permissions, permission, users, roles, customer_feedback
    RESTART IDENTITY CASCADE;

-- =============================================================================
-- 3. CẬP NHẬT RÀNG BUỘC (CONSTRAINTS) ĐỒNG BỘ VỚI JAVA ENUM
-- =============================================================================
ALTER TABLE repair_requests DROP CONSTRAINT IF EXISTS repair_requests_status_check;
ALTER TABLE repair_requests ADD CONSTRAINT repair_requests_status_check CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

ALTER TABLE room DROP CONSTRAINT IF EXISTS room_room_status_check;
ALTER TABLE room ADD CONSTRAINT room_room_status_check CHECK (room_status IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING', 'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check CHECK (payment_method IN ('CASH', 'CARD', 'VNPAY', 'TRANSFER'));
CREATE UNIQUE INDEX IF NOT EXISTS uk_invoices_booking_invoice_type ON invoices (booking_id, invoice_type);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_id_type_check;
ALTER TABLE customers ADD CONSTRAINT customers_id_type_check CHECK (id_type IN ('CCCD', 'PASSPORT', 'OTHER'));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_triggered_by_process_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_triggered_by_process_check
    CHECK (triggered_by_process IN ('TASK_CLEANING', 'TASK_IN_PROGRESS', 'TASK_COMPLETION', 'TASK_CANCELLATION', 'TASK_SKIPPED', 'TASK_MAINTENANCE', 'CHECKIN', 'CHECKOUT'));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_previous_state_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_previous_state_check
    CHECK (previous_state IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING', 'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_current_state_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_current_state_check
    CHECK (current_state IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING', 'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'));

ALTER TABLE customer_feedback ALTER COLUMN deleted SET DEFAULT FALSE;

-- =============================================================================
-- 4. ROLES & PERMISSIONS
-- =============================================================================
INSERT INTO roles (role_name) VALUES
    ('ADMIN'), ('MANAGER'), ('CUSTOMER'), ('RECEPTIONIST'), ('MAINTENANCE'), ('HOUSEKEEPER');

INSERT INTO permission (name) VALUES
    ('USER_VIEW'), ('USER_CREATE'), ('USER_UPDATE'), ('USER_DELETE'), ('USER_AUTHORIZE'),
    ('ROOM_VIEW'), ('ROOM_CREATE'), ('ROOM_UPDATE'), ('ROOM_DELETE'),
    ('ROOM_TYPE_VIEW'), ('ROOM_TYPE_CREATE'), ('ROOM_TYPE_UPDATE'), ('ROOM_TYPE_DELETE'),
    ('CUSTOMER_VIEW'), ('CUSTOMER_CREATE'), ('CUSTOMER_UPDATE'), ('CUSTOMER_DELETE'),
    ('BOOKING_VIEW'), ('BOOKING_CREATE'), ('BOOKING_UPDATE'), ('BOOKING_DELETE'), ('BOOKING_VIEW_OWN'),
    ('CHECKIN_VIEW'), ('CHECKOUT_VIEW'),
    ('HOUSEKEEPING_VIEW'), ('HOUSEKEEPING_CREATE'), ('HOUSEKEEPING_UPDATE'), ('HOUSEKEEPING_DELETE'),
    ('EQUIPMENT_VIEW'), ('EQUIPMENT_CREATE'), ('EQUIPMENT_UPDATE'), ('EQUIPMENT_DELETE'),
    ('MAINTENANCE_VIEW'), ('MAINTENANCE_CREATE'), ('MAINTENANCE_UPDATE'), ('MAINTENANCE_DELETE'),
    ('FEEDBACK_VIEW'), ('FEEDBACK_CREATE'), ('FEEDBACK_UPDATE'), ('FEEDBACK_DELETE'),
    ('FEEDBACK_VIEW_OWN'), ('FEEDBACK_UPDATE_OWN'), ('FEEDBACK_DELETE_OWN'),
    ('INVOICE_VIEW'), ('INVOICE_CREATE'), ('INVOICE_UPDATE'), ('INVOICE_DELETE'),
    ('DASHBOARD_VIEW')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permission p WHERE r.role_name = 'ADMIN';

-- =============================================================================
-- 5. USERS
-- =============================================================================
INSERT INTO users (full_name, email, phone, password, account_status, created_at, role_id) VALUES
    ('HMS Administrator', 'admin@hms.com', '0901234560', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 1),
    ('Nguyễn Hồng Hải', 'manager1@hms.com', '0901234561', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 2),
    ('Trần Kim Oanh', 'manager2@hms.com', '0901234562', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 2),
    ('Phạm Minh Trí', 'reception1@hms.com', '0901234563', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Lê Thu Thảo', 'reception2@hms.com', '0901234564', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Vũ Hoàng Nam', 'reception3@hms.com', '0901234565', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Nguyễn Thị Hoa', 'housekeeper1@hms.com', '0901234566', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Trần Thị Mai', 'housekeeper2@hms.com', '0901234567', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Lê Thị Đào', 'housekeeper3@hms.com', '0901234568', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Hoàng Ngọc Sơn', 'housekeeper4@hms.com', '0901234571', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Nguyễn Văn Hùng', 'maintenance1@hms.com', '0901234569', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Trần Văn Mạnh', 'maintenance2@hms.com', '0901234570', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Lý Quốc Đại', 'maintenance3@hms.com', '0901234572', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Đinh Khắc Dũng', 'maintenance4@hms.com', '0901234573', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Khách test', 'customer@test.com', '0999999999', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3);

-- =============================================================================
-- 6. ROOM TYPES
-- =============================================================================
INSERT INTO room_type (type_name, description, base_price, max_guests, status) VALUES
    ('Standard Single', 'Phòng Tiêu Chuẩn 1 Giường Đơn', 500000.00, 1, 'ACTIVE'),
    ('Standard Double', 'Phòng Tiêu Chuẩn 1 Giường Đôi', 800000.00, 2, 'ACTIVE'),
    ('Deluxe City View', 'Phòng Deluxe Hướng Thành Phố', 1200000.00, 2, 'ACTIVE'),
    ('Family Suite', 'Phòng Suite Gia Đình Rộng Rãi', 2000000.00, 4, 'ACTIVE'),
    ('President Suite', 'Phòng Tổng Thống Đẳng Cấp Thượng Lưu', 5000000.00, 4, 'ACTIVE');

-- =============================================================================
-- 7. ROOMS
-- =============================================================================
`;

let roomInserts = 'INSERT INTO room (room_number, room_type_id, room_status, floor_number, description) VALUES\n';
const totalRooms = 50;
let roomData = [];
for (let i = 1; i <= totalRooms; i++) {
  let floor = Math.ceil(i / 10);
  let roomMod = (i % 10).toString();
  if (roomMod.length === 1) roomMod = '0' + roomMod;
  let roomNum = floor.toString() + roomMod;
  if (roomNum.endsWith('00')) roomNum = floor.toString() + '10';
  
  let typeId = getRandomInt(1, 5);
  let status = getRandomItem(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE']);
  
  roomData.push("('" + roomNum + "', " + typeId + ", '" + status + "', " + floor + ", 'Phòng " + roomNum + " tầng " + floor + "')");
}
sql += roomInserts + roomData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 8. CUSTOMERS\n';
sql += '-- =============================================================================\n';

let customerInserts = 'INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status) VALUES\n';
const totalCustomers = 150;
let custData = [];
for (let i = 1; i <= totalCustomers; i++) {
  let name = getRandomItem(lastNames) + ' ' + getRandomItem(firstNames) + ' ' + getRandomItem(firstNames);
  let email = 'customer' + i + '@hms.com';
  let phone = '090' + getRandomInt(1000000, 9999999).toString();
  let idType = getRandomItem(['CCCD', 'PASSPORT']);
  let idNumber = '00109' + getRandomInt(1000000, 9999999).toString();
  custData.push("('" + name + "', '" + email + "', '" + phone + "', '" + idType + "', '" + idNumber + "', 'Việt Nam', NOW() - INTERVAL '" + getRandomInt(1, 300) + " days', 'ACTIVE')");
}
sql += customerInserts + custData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 9. BOOKINGS & INVOICES\n';
sql += '-- =============================================================================\n';

let bookingInserts = 'INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at) VALUES\n';
const totalBookings = 200;
let bookData = [];
let invoiceData = [];

for (let i = 1; i <= totalBookings; i++) {
  let custId = getRandomInt(1, totalCustomers);
  let roomId = getRandomInt(1, totalRooms);
  let typeId = getRandomInt(1, 5);
  let status = getRandomItem(['CHECKED_OUT', 'CHECKED_OUT', 'CHECKED_OUT', 'CONFIRMED', 'PENDING', 'CANCELLED', 'CHECKED_IN']);
  let type = roomTypes.find(t => t.id === typeId);
  let nights = getRandomInt(1, 5);
  let total = type.price * nights;
  
  let offsetDays = getRandomInt(1, 60);
  
  bookData.push("(" + custId + ", " + roomId + ", " + typeId + ", " + type.price + ", 1, NOW() - INTERVAL '" + offsetDays + " days', NOW() - INTERVAL '" + (offsetDays - nights) + " days', '" + status + "', " + total + ", 1, NOW() - INTERVAL '" + (offsetDays + 2) + " days')");
  
  let payStatus = (status === 'CHECKED_OUT' || status === 'CHECKED_IN') ? 'PAID' : (status === 'CANCELLED' ? 'CANCELLED' : 'PENDING');
  let payMethod = payStatus === 'PAID' ? getRandomItem(["'CASH'", "'TRANSFER'", "'CARD'"]) : 'NULL';
  let payTime = payStatus === 'PAID' ? ("NOW() - INTERVAL '" + offsetDays + " days'") : 'NULL';
  
  invoiceData.push("(" + i + ", " + total + ", '" + payStatus + "', " + payMethod + ", " + payTime + ", 'ROOM')");
}
sql += bookingInserts + bookData.join(',\n') + ';\n\n';

sql += 'INSERT INTO invoices (booking_id, amount, payment_status, payment_method, paid_at, invoice_type) VALUES\n';
sql += invoiceData.join(',\n') + ';\n\n';


sql += '-- =============================================================================\n';
sql += '-- 10. CUSTOMER FEEDBACK\n';
sql += '-- =============================================================================\n';
let feedbackData = [];
for (let i = 1; i <= 50; i++) {
  let bookId = getRandomInt(1, totalBookings); // Assuming some have feedback
  let custId = getRandomInt(1, totalCustomers);
  let rating = getRandomInt(1, 5);
  let category = getRandomItem(['Room', 'Cleanliness', 'Service', 'Staff']);
  let status = getRandomItem(['PENDING', 'REVIEWED', 'RESOLVED']);
  let comment = 'Test comment ' + i;
  feedbackData.push("(" + bookId + ", " + custId + ", " + rating + ", '" + category + "', '" + comment + "', '" + status + "', NOW() - INTERVAL '" + getRandomInt(1, 30) + " days', NULL, NULL, FALSE)");
}
sql += 'INSERT INTO customer_feedback (booking_id, customer_id, rating, category, comment, status, created_at, reply, reply_at, deleted) VALUES\n';
sql += feedbackData.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';

sql += '-- =============================================================================\n';
sql += '-- 11. EQUIPMENTS & IMAGES\n';
sql += '-- =============================================================================\n';
let equipmentData = [];
let equipmentImagesData = [];
for (let i = 1; i <= 20; i++) {
  let name = getRandomItem(['Tivi Sony 55 inch', 'Điều hòa Daikin', 'Tủ lạnh mini', 'Máy sấy tóc', 'Tivi Samsung 65 inch', 'Ấm siêu tốc']);
  let code = 'EQ-' + i;
  let status = getRandomItem(['ACTIVE', 'MAINTENANCE', 'INACTIVE']);
  equipmentData.push("('" + name + "', '" + code + "', 'Mô tả " + name + "', '" + status + "', NOW())");
  equipmentImagesData.push("('/uploads/equipments/eq_" + i + ".jpg', TRUE, " + i + ", NOW())");
}
sql += 'INSERT INTO equipments (equipment_name, equipment_code, description, status, created_at) VALUES\n';
sql += equipmentData.join(',\n') + ';\n\n';

sql += 'INSERT INTO equipment_images (image_url, is_primary, equipment_id, created_at) VALUES\n';
sql += equipmentImagesData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 12. ROOM IMAGES\n';
sql += '-- =============================================================================\n';
let roomImgData = [];
for (let i = 1; i <= totalRooms; i++) {
  roomImgData.push("(" + i + ", 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800', 'Ảnh phòng " + i + "', NOW())");
}
sql += 'INSERT INTO room_img (room_id, image_url, description, uploaded_at) VALUES\n';
sql += roomImgData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 13. REPAIR REQUESTS\n';
sql += '-- =============================================================================\n';
let repairData = [];
for (let i = 1; i <= 20; i++) {
  let roomId = getRandomInt(1, totalRooms);
  let eqId = getRandomInt(1, 20);
  let status = getRandomItem(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
  let severity = getRandomItem(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  let reportedBy = getRandomInt(4, 6); // Receptionists
  let assignedTo = getRandomInt(11, 14); // Maintenance
  repairData.push("(" + roomId + ", " + eqId + ", " + reportedBy + ", " + assignedTo + ", 'Lỗi thiết bị " + i + "', 'Mô tả lỗi " + i + "', NULL, NULL, '" + severity + "', '" + status + "', NOW())");
}
sql += 'INSERT INTO repair_requests (room_id, equipment_id, reported_by, assigned_to, issue_title, issue_description, diagnosis, repair_result, severity, status, created_at) VALUES\n';
sql += repairData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 14. ROOM STATE HISTORY\n';
sql += '-- =============================================================================\n';
let historyData = [];
for (let i = 1; i <= 30; i++) {
  let roomId = getRandomInt(1, totalRooms);
  let triggeredBy = getRandomInt(7, 10); // Housekeepers
  historyData.push("(" + roomId + ", 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', " + triggeredBy + ", NOW() - INTERVAL '" + getRandomInt(1, 10) + " hours')");
}
sql += 'INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at) VALUES\n';
sql += historyData.join(',\n') + ';\n\n';

sql += '-- =============================================================================\n';
sql += '-- 15. HOUSEKEEPING TASKS (Nếu có)\n';
sql += '-- =============================================================================\n';
let hkData = [];
for (let i = 1; i <= 20; i++) {
  let roomId = getRandomInt(1, totalRooms);
  let status = getRandomItem(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
  let assignedTo = getRandomInt(7, 10); // Housekeepers
  let assignedBy = getRandomInt(2, 3); // Managers
  hkData.push("(" + roomId + ", " + assignedTo + ", " + assignedBy + ", '" + status + "', 'Ghi chú dọn phòng " + i + "', NOW(), NOW(), NOW(), NOW())");
}
sql += 'INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at) VALUES\n';
sql += hkData.join(',\n') + ' ON CONFLICT DO NOTHING;\n\n';

fs.writeFileSync('data.sql', sql, 'utf8');
console.log('Successfully generated data.sql with ALL tables!');
