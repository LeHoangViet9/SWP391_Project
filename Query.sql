-- Dọn sạch dữ liệu cũ và reset các chuỗi ID tự tăng
TRUNCATE TABLE room_state_history, room_img, equipment_images, equipment_checks, repair_requests, equipments, invoices, bookings, customers, room, room_type, users, roles RESTART IDENTITY CASCADE;

-- Cập nhật/Sửa đổi các check constraint cũ của Hibernate để khớp với các giá trị Enum mới trong Java code
-- 1. Đồng bộ với MaintenanceStatus enum
ALTER TABLE repair_requests DROP CONSTRAINT IF EXISTS repair_requests_status_check;
ALTER TABLE repair_requests ADD CONSTRAINT repair_requests_status_check
    CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- 2. CẬP NHẬT: Đồng bộ đầy đủ với RoomStatus enum
ALTER TABLE room DROP CONSTRAINT IF EXISTS room_room_status_check;
ALTER TABLE room ADD CONSTRAINT room_room_status_check
    CHECK (room_status IN ('AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING', 'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER'));

-- 3. Đồng bộ với BookingStatus enum
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
    CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'));

-- 4. Đồng bộ với PaymentStatus enum
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
    CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));

-- 5. Đồng bộ với PaymentMethod enum
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check
    CHECK (payment_method IN ('CASH', 'CARD', 'VNPAY', 'TRANSFER'));

-- 6. Đồng bộ với IdType enum
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_id_type_check;
ALTER TABLE customers ADD CONSTRAINT customers_id_type_check
    CHECK (id_type IN ('CCCD', 'PASSPORT', 'OTHER'));

-- 1. BẢNG ROLES (6 Vai trò tiêu chuẩn của hệ thống)
INSERT INTO roles (role_name, permissions)
VALUES
    ('ADMIN', '["*"]'),
    ('MANAGER', '["*"]'),
    ('CUSTOMER', '["booking:read", "booking:create"]'),
    ('RECEPTIONIST', '["room:read", "room:update", "booking:read", "booking:create", "booking:update"]'),
    ('MAINTENANCE', '["equipment:read", "equipment:update", "maintenance:read", "maintenance:update"]'),
    ('HOUSEKEEPER', '["room:read", "room:update-status"]');

-- 2. BẢNG USERS (15 tài khoản đăng nhập)
-- Mật khẩu: 123456a
INSERT INTO users (full_name, email, phone, password, account_status, created_at, role_id)
VALUES
    ('HMS Administrator', 'admin@hms.com', '0901234560', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 1),
    ('Nguyễn Hồng Hải', 'manager1@hms.com', '0901234561', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 2),
    ('Trần Kim Oanh', 'manager2@hms.com', '0901234562', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 2),
    ('Phạm Minh Trí', 'reception1@hms.com', '0901234563', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Lê Thu Thảo', 'reception2@hms.com', '0901234564', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Vũ Hoàng Nam', 'reception3@hms.com', '0901234565', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 4),
    ('Nguyễn Thị Hoa', 'housekeeper1@hms.com', '0901234566', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Trần Thị Mai', 'housekeeper2@hms.com', '0901234567', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Lê Thị Đào', 'housekeeper3@hms.com', '0901234568', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 6),
    ('Nguyễn Văn Hùng', 'maintenance1@hms.com', '0901234569', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Trần Văn Mạnh', 'maintenance2@hms.com', '0901234570', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Phạm Văn Dũng', 'maintenance3@hms.com', '0901234571', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Trần Văn An', 'customer1@gmail.com', '0908111222', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Lê Thị Bình', 'customer2@gmail.com', '0908333444', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Nguyễn Hoàng Cường', 'customer3@gmail.com', '0908555666', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3);

-- 3. BẢNG ROOM_TYPE (15 Loại phòng)
INSERT INTO room_type (type_name, description, base_price, max_guests, status)
VALUES
    ('Standard Single', 'Phòng Tiêu Chuẩn 1 Giường Đơn', 500000.00, 1, 'ACTIVE'),
    ('Standard Double', 'Phòng Tiêu Chuẩn 1 Giường Đôi', 700000.00, 2, 'ACTIVE'),
    ('Superior Single', 'Phòng Superior 1 Giường Đơn', 800000.00, 1, 'ACTIVE'),
    ('Superior Double', 'Phòng Superior 1 Giường Đôi', 1000000.00, 2, 'ACTIVE'),
    ('Deluxe City View', 'Phòng Deluxe Hướng Thành Phố', 1200000.00, 2, 'ACTIVE'),
    ('Deluxe Ocean View', 'Phòng Deluxe Hướng Biển', 1500000.00, 2, 'ACTIVE'),
    ('Family Suite', 'Phòng Suite Gia Đình Rộng Rãi', 2200000.00, 4, 'ACTIVE'),
    ('Executive Suite', 'Phòng Suite Sang Trọng Cho Doanh Nhân', 3000000.00, 2, 'ACTIVE'),
    ('President Suite', 'Phòng Tổng Thống Đẳng Cấp Thượng Lưu', 8000000.00, 4, 'ACTIVE'),
    ('Studio Room', 'Phòng Dạng Studio Có Bếp Nhỏ', 1100000.00, 2, 'ACTIVE'),
    ('Connecting Room', 'Phòng Thông Nhau Cho Gia Đình Đông Người', 2000000.00, 4, 'ACTIVE'),
    ('Penthouse', 'Căn Hộ Áp Mái Thượng Hạng', 12000000.00, 6, 'ACTIVE'),
    ('Bungalow Garden View', 'Bungalow Hướng Sân Vườn Yên Tĩnh', 1800000.00, 2, 'ACTIVE'),
    ('Bungalow Beach Front', 'Bungalow Sát Bờ Biển Thơ Mộng', 2800000.00, 2, 'ACTIVE'),
    ('Economy Room', 'Phòng Tiết Kiệm Không Cửa Sổ', 400000.00, 1, 'ACTIVE');

-- 4. BẢNG ROOM (15 Phòng)
INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
VALUES
    ('101', 1, 'AVAILABLE', 1, 'Phòng 101 - Standard Single lầu 1'),
    ('102', 2, 'AVAILABLE', 1, 'Phòng 102 - Standard Double lầu 1'),
    ('201', 3, 'AVAILABLE', 2, 'Phòng 201 - Superior Single lầu 2'),
    ('202', 4, 'OCCUPIED', 2, 'Phòng 202 - Superior Double lầu 2'),
    ('301', 5, 'AVAILABLE', 3, 'Phòng 301 - Deluxe City View lầu 3'),
    ('302', 6, 'AVAILABLE', 3, 'Phòng 302 - Deluxe Ocean View lầu 3'),
    ('401', 7, 'AVAILABLE', 4, 'Phòng 401 - Family Suite lầu 4'),
    ('402', 8, 'OCCUPIED', 4, 'Phòng 402 - Executive Suite lầu 4'),
    ('501', 9, 'AVAILABLE', 5, 'Phòng 501 - President Suite lầu 5'),
    ('502', 10, 'DIRTY', 5, 'Phòng 502 - Studio Room cần dọn dẹp'),
    ('601', 11, 'AVAILABLE', 6, 'Phòng 601 - Connecting Room lầu 6'),
    ('701', 12, 'MAINTENANCE', 7, 'Phòng 701 - Penthouse đang bảo trì điều hòa'),
    ('801', 13, 'AVAILABLE', 8, 'Phòng 801 - Bungalow Garden View'),
    ('802', 14, 'AVAILABLE', 8, 'Phòng 802 - Bungalow Beach Front'),
    ('103', 15, 'AVAILABLE', 1, 'Phòng 103 - Economy Room lầu 1');

-- 5. BẢNG CUSTOMERS (15 Khách hàng)
INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status)
VALUES
    ('Trần Văn An', 'customer1@gmail.com', '0908111222', 'CCCD', '001095001234', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Lê Thị Bình', 'customer2@gmail.com', '0908333444', 'CCCD', '001095001235', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Nguyễn Hoàng Cường', 'customer3@gmail.com', '0908555666', 'CCCD', '001095001236', 'Việt Nam', NOW(), 'ACTIVE'),
    ('John Doe', 'john.doe@gmail.com', '0908777888', 'PASSPORT', 'B1234567', 'USA', NOW(), 'ACTIVE'),
    ('Alice Smith', 'alice.smith@gmail.com', '0908999000', 'PASSPORT', 'A7654321', 'UK', NOW(), 'ACTIVE'),
    ('Phạm Minh Hùng', 'hung.pham@gmail.com', '0902111333', 'CCCD', '001095001237', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Vũ Thị Lan', 'lan.vu@gmail.com', '0902444555', 'CCCD', '001095001238', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Đỗ Quốc Anh', 'anh.do@gmail.com', '0902777888', 'CCCD', '001095001239', 'Việt Nam', NOW(), 'ACTIVE'),
    ('David Beckham', 'david.b@gmail.com', '0903111222', 'PASSPORT', 'C9876543', 'UK', NOW(), 'ACTIVE'),
    ('Maria Sharapova', 'maria.s@gmail.com', '0903333444', 'PASSPORT', 'R8765432', 'Russia', NOW(), 'ACTIVE'),
    ('Hoàng Văn Long', 'long.hoang@gmail.com', '0903555666', 'CCCD', '001095001240', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Ngô Kim Liên', 'lien.ngo@gmail.com', '0903777888', 'CCCD', '001095001241', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Michael Jordan', 'michael.j@gmail.com', '0904111222', 'PASSPORT', 'U5432109', 'USA', NOW(), 'ACTIVE'),
    ('Bùi Tiến Dũng', 'dung.bui@gmail.com', '0904333444', 'CCCD', '001095001242', 'Việt Nam', NOW(), 'ACTIVE'),
    ('Nguyễn Thị Oanh', 'oanh.nguyen@gmail.com', '0904555666', 'CCCD', '001095001243', 'Việt Nam', NOW(), 'ACTIVE');

-- 6. BẢNG BOOKINGS (15 Đơn đặt phòng)
INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at)
VALUES
    (1, 1, 1, 500000.00, 1, '2026-06-15 14:00:00', '2026-06-17 12:00:00', 'CONFIRMED', 1000000.00, 1, NOW()),
    (2, 2, 2, 700000.00, 1, '2026-06-20 14:00:00', '2026-06-22 12:00:00', 'CONFIRMED', 1400000.00, 1, NOW()),
    (3, 4, 4, 1000000.00, 1, '2026-06-10 14:00:00', '2026-06-12 12:00:00', 'CHECKED_IN', 2000000.00, 1, NOW()),
    (4, 5, 5, 1200000.00, 1, '2026-06-11 14:00:00', '2026-06-13 12:00:00', 'CHECKED_IN', 2400000.00, 1, NOW()),
    (5, 6, 6, 1500000.00, 1, '2026-06-01 14:00:00', '2026-06-03 12:00:00', 'CHECKED_OUT', 3000000.00, 1, NOW()),
    (6, 3, 3, 800000.00, 1, '2026-06-02 14:00:00', '2026-06-04 12:00:00', 'CHECKED_OUT', 1600000.00, 1, NOW()),
    (7, 8, 8, 3000000.00, 1, '2026-06-08 14:00:00', '2026-06-10 12:00:00', 'CHECKED_OUT', 6000000.00, 1, NOW()),
    (8, 9, 9, 8000000.00, 1, '2026-06-25 14:00:00', '2026-06-28 12:00:00', 'CONFIRMED', 24000000.00, 1, NOW()),
    (9, NULL, 6, 1500000.00, 1, '2026-06-18 14:00:00', '2026-06-20 12:00:00', 'PENDING', 3000000.00, 1, NOW()),
    (10, NULL, 7, 2200000.00, 1, '2026-06-19 14:00:00', '2026-06-21 12:00:00', 'PENDING', 4400000.00, 1, NOW()),
    (11, 10, 10, 1100000.00, 1, '2026-06-05 14:00:00', '2026-06-06 12:00:00', 'CHECKED_OUT', 1100000.00, 1, NOW()),
    (12, 11, 11, 2000000.00, 1, '2026-06-06 14:00:00', '2026-06-08 12:00:00', 'CHECKED_OUT', 4000000.00, 1, NOW()),
    (13, NULL, 12, 12000000.00, 1, '2026-07-01 14:00:00', '2026-07-05 12:00:00', 'PENDING', 48000000.00, 1, NOW()),
    (14, 15, 15, 400000.00, 1, '2026-06-12 14:00:00', '2026-06-14 12:00:00', 'CONFIRMED', 800000.00, 1, NOW()),
    (15, NULL, 13, 1800000.00, 1, '2026-06-15 14:00:00', '2026-06-16 12:00:00', 'CANCELLED', 1800000.00, 1, NOW());

-- 7. BẢNG INVOICES (15 Hóa đơn, liên kết 1-1 với Bookings)
INSERT INTO invoices (booking_id, amount, payment_status, payment_method, paid_at)
VALUES
    (1, 1000000.00, 'PENDING', NULL, NULL),
    (2, 1400000.00, 'PENDING', NULL, NULL),
    (3, 2000000.00, 'PAID', 'CASH', NOW()),
    (4, 2400000.00, 'PAID', 'TRANSFER', NOW()),
    (5, 3000000.00, 'PAID', 'CARD', NOW()),
    (6, 1600000.00, 'PAID', 'CASH', NOW()),
    (7, 6000000.00, 'PAID', 'TRANSFER', NOW()),
    (8, 24000000.00, 'PAID', 'CARD', NOW()),
    (9, 3000000.00, 'PENDING', NULL, NULL),
    (10, 4400000.00, 'PENDING', NULL, NULL),
    (11, 1100000.00, 'PAID', 'CASH', NOW()),
    (12, 4000000.00, 'PAID', 'TRANSFER', NOW()),
    (13, 48000000.00, 'PENDING', NULL, NULL),
    (14, 800000.00, 'PENDING', NULL, NULL),
    (15, 1800000.00, 'CANCELLED', NULL, NULL);


-- Xóa sạch dữ liệu cũ của bảng thiết bị (nếu có dở dang)
TRUNCATE TABLE equipment_images, equipment_checks, repair_requests, equipments RESTART IDENTITY CASCADE;

-- Chèn dữ liệu chuẩn (đã có cột location từ bước trước)
INSERT INTO equipments (equipment_name, equipment_code, description, location, status, created_at)
VALUES
    ('Tivi Sony 55 inch', 'TV-101', 'Tivi thông minh Sony 4K', 'Phòng 101', 'ACTIVE', NOW()),
    ('Điều hòa Daikin 1.5 HP', 'AC-101', 'Điều hòa không khí Daikin', 'Phòng 101', 'ACTIVE', NOW()),
    ('Tủ lạnh mini Electrolux', 'RF-101', 'Tủ lạnh mini 50 lít', 'Phòng 101', 'ACTIVE', NOW()),
    ('Máy sấy tóc Panasonic', 'HD-101', 'Máy sấy tóc 1200W', 'Phòng 101', 'ACTIVE', NOW()),
    ('Điều hòa Panasonic 2 HP', 'AC-202', 'Điều hòa Inverter Panasonic', 'Phòng 202', 'ACTIVE', NOW()),
    ('Tivi Samsung 65 inch', 'TV-301', 'Tivi QLED Samsung', 'Phòng 301', 'ACTIVE', NOW()),
    ('Điều hòa Daikin 2.5 HP', 'AC-301', 'Điều hòa công suất lớn Daikin', 'Phòng 301', 'ACTIVE', NOW()),
    ('Bình nóng lạnh Rossi', 'WH-301', 'Bình nước nóng Rossi 30 lít', 'Phòng 301', 'ACTIVE', NOW()),
    ('Tivi Sony 75 inch', 'TV-501', 'Tivi Sony Bravia OLED', 'Phòng 501', 'ACTIVE', NOW()),
    ('Điều hòa trung tâm Daikin', 'AC-701', 'Hệ thống điều hòa trung tâm', 'Phòng 701', 'BROKEN', NOW()),
    ('Tủ lạnh Panasonic 150 lít', 'RF-701', 'Tủ lạnh hai cánh Panasonic', 'Phòng 701', 'ACTIVE', NOW()),
    ('Tivi LG 43 inch', 'TV-103', 'Tivi LG Smart Full HD', 'Phòng 103', 'ACTIVE', NOW()),
    ('Điều hòa Midea 1 HP', 'AC-103', 'Điều hòa Midea tiết kiệm điện', 'Phòng 103', 'ACTIVE', NOW()),
    ('Ấm siêu tốc Philips', 'KT-101', 'Ấm đun nước siêu tốc 1.8 lít', 'Phòng 101', 'ACTIVE', NOW()),
    ('Két sắt chống cháy Honeywell', 'SF-501', 'Két sắt vân tay Honeywell', 'Phòng 501', 'ACTIVE', NOW());
-- 8. BẢNG EQUIPMENTS
-- Thêm cột location vào danh sách cột và bổ sung giá trị tương ứng ở VALUES

-- 9. BẢNG EQUIPMENT_CHECKS (15 Lượt kiểm tra thiết bị)
INSERT INTO equipment_checks (condition_status, check_note, checked_by_id, equipment_id, checked_at)
VALUES
    ('GOOD', 'Tivi hoạt động tốt, hình ảnh sắc nét', 10, 1, NOW()),
    ('GOOD', 'Điều hòa làm lạnh nhanh, không có tiếng ồn', 10, 2, NOW()),
    ('GOOD', 'Tủ lạnh làm đá nhanh, sạch sẽ', 11, 3, NOW()),
    ('GOOD', 'Máy sấy tóc hoạt động ổn định', 11, 4, NOW()),
    ('GOOD', 'Điều hòa Panasonic chạy tốt', 12, 5, NOW()),
    ('GOOD', 'Tivi QLED Samsung chạy mượt', 10, 6, NOW()),
    ('GOOD', 'Điều hòa Daikin làm lạnh tốt', 10, 7, NOW()),
    ('GOOD', 'Bình nóng lạnh Rossi hoạt động bình thường, nước nóng nhanh', 11, 8, NOW()),
    ('GOOD', 'Tivi OLED Sony hoạt động hoàn hảo', 12, 9, NOW()),
    ('BAD', 'Điều hòa trung tâm không hoạt động, bị hỏng block', 12, 10, NOW()),
    ('GOOD', 'Tủ lạnh Panasonic làm mát tốt', 10, 11, NOW()),
    ('GOOD', 'Tivi LG hoạt động bình thường', 11, 12, NOW()),
    ('GOOD', 'Điều hòa Midea làm mát tốt', 12, 13, NOW()),
    ('GOOD', 'Ấm siêu tốc đun nước nhanh sôi', 10, 14, NOW()),
    ('GOOD', 'Két sắt khóa vân tay nhạy', 11, 15, NOW());

-- 10. BẢNG EQUIPMENT_IMAGES (15 Hình ảnh thiết bị)
INSERT INTO equipment_images (image_url, is_primary, equipment_id, created_at)
VALUES
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/sony_tv.jpg', TRUE, 1, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/daikin_ac.jpg', TRUE, 2, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/electrolux_fridge.jpg', TRUE, 3, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/panasonic_dryer.jpg', TRUE, 4, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/panasonic_ac.jpg', TRUE, 5, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/samsung_tv.jpg', TRUE, 6, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/daikin_ac_large.jpg', TRUE, 7, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/rossi_heater.jpg', TRUE, 8, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/sony_oled.jpg', TRUE, 9, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/daikin_central.jpg', TRUE, 10, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/panasonic_fridge.jpg', TRUE, 11, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/lg_tv.jpg', TRUE, 12, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/midea_ac.jpg', TRUE, 13, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/philips_kettle.jpg', TRUE, 14, NOW()),
    ('https://res.cloudinary.com/dkkd1nhqr/image/upload/v1/equipments/honeywell_safe.jpg', TRUE, 15, NOW());

-- 11. BẢNG REPAIR_REQUESTS (15 Phiếu sửa chữa/bảo trì)

INSERT INTO repair_requests (room_id, equipment_id, reported_by, assigned_to, issue_title, issue_description, repair_reason, diagnosis, repair_result, severity, status, created_at)
VALUES
    (1, 1, 4, 10, 'Lỗi Tivi không kết nối được Wifi', 'Khách báo tivi Sony phòng 101 không thể kết nối mạng không dây.', 'Thiết bị không vào được mạng', 'Lỗi cài đặt phần mềm mạng của tivi.', 'Đã reset cài đặt mạng và kết nối lại thành công.', 'LOW', 'COMPLETED', NOW()),
    (1, 2, 4, 10, 'Điều hòa rò rỉ nước', 'Điều hòa Daikin phòng 101 bị chảy nước từ cục lạnh.', 'Chảy nước cục lạnh', 'Đường ống thoát nước bị tắc do bụi bẩn.', 'Đã vệ sinh ống thoát nước và bảo dưỡng máy lạnh.', 'MEDIUM', 'COMPLETED', NOW()),
    (4, 5, 4, 11, 'Điều hòa không mát', 'Điều hòa phòng 202 bật nhưng chỉ có gió, không mát.', 'Máy lạnh không lạnh', 'Bị rò rỉ gas ở đầu nối ống đồng.', 'Đã hàn lại chỗ rò rỉ, nạp thêm gas R32.', 'HIGH', 'COMPLETED', NOW()),
    (12, 10, 4, 12, 'Hỏng block điều hòa trung tâm', 'Điều hòa trung tâm phòng 701 ngừng hoạt động hoàn toàn.', 'Hệ thống điều hòa trung tâm bị sập', 'Block điều hòa bị cháy do quá tải điện áp.', NULL, 'CRITICAL', 'IN_PROGRESS', NOW()),
    (5, 6, 7, 10, 'Tivi phòng 301 bị sọc màn hình', 'Housekeeper báo màn hình tivi phòng 301 có 2 đường sọc dọc màu xanh.', 'Hỏng màn hình tivi', NULL, NULL, 'HIGH', 'ASSIGNED', NOW()),
    (1, 14, 7, 11, 'Ấm siêu tốc phòng 101 hỏng đế', 'Đế tiếp điện ấm siêu tốc bị cháy khét.', 'Chập cháy đế điện', 'Chập điện ở đế ấm siêu tốc do tràn nước.', 'Đã thay thế đế cắm điện mới.', 'LOW', 'COMPLETED', NOW()),
    (9, 15, 4, NULL, 'Két sắt phòng 501 hết pin', 'Khách báo két sắt không nhận vân tay và mật khẩu do màn hình báo pin yếu.', 'Két sắt không mở được', NULL, NULL, 'LOW', 'PENDING', NOW()),
    (2, NULL, 7, 12, 'Bóng đèn trần phòng 102 bị cháy', 'Hỏng 2 bóng đèn led âm trần khu vực nhà tắm.', 'Phòng tắm bị tối', 'Tuổi thọ bóng đèn led đã hết.', 'Đã thay mới 2 bóng đèn led 9W.', 'LOW', 'COMPLETED', NOW()),
    (3, NULL, 7, NULL, 'Khóa cửa phòng 201 bị kẹt', 'Khóa từ phòng 201 rất khó quét thẻ, cần kiểm tra.', 'Lỗi khóa cửa từ', NULL, NULL, 'MEDIUM', 'PENDING', NOW()),
    (5, 8, 4, 11, 'Bình nóng lạnh phòng 301 rò điện', 'Đèn báo chống giật trên dây nguồn nhấp nháy đỏ liên tục.', 'Nghi ngờ rò rỉ điện nguy hiểm', NULL, NULL, 'CRITICAL', 'ASSIGNED', NOW()),
    (6, NULL, 7, 10, 'Bồn cầu phòng 302 bị tắc', 'Bồn cầu thoát nước rất chậm sau khi sử dụng.', 'Tắc nghẽn bồn cầu', 'Bị nghẹt dị vật do khách làm rơi.', 'Đã thông tắc bồn cầu bằng dụng cụ chuyên dụng.', 'HIGH', 'COMPLETED', NOW()),
    (12, 11, 7, NULL, 'Tủ lạnh phòng 701 không làm lạnh', 'Tủ lạnh hai cánh cắm điện vẫn sáng bên trong không mát.', 'Tủ lạnh hỏng khoang mát', NULL, NULL, 'MEDIUM', 'PENDING', NOW()),
    (15, 13, 7, 12, 'Điều hòa phòng 103 phát ra tiếng kêu to', 'Điều hòa Midea chạy phát ra tiếng rít lớn từ cục nóng bên ngoài.', 'Tiếng ồn cục nóng lớn', NULL, NULL, 'MEDIUM', 'ASSIGNED', NOW()),
    (9, 9, 4, 10, 'Điều khiển tivi phòng 501 bị hỏng', 'Điều khiển không bấm được nút nguồn.', 'Liệt phím điều khiển', 'Bị chảy nước pin làm rỉ sét tiếp điểm.', 'Đã vệ sinh tiếp điểm và thay pin mới.', 'LOW', 'COMPLETED', NOW()),
    (13, NULL, 4, NULL, 'Cửa kính ban công phòng 801 bị nứt', 'Kính cường lực ban công bị nứt góc dưới bên trái.', 'Nứt kính ban công nguy hiểm', NULL, NULL, 'HIGH', 'PENDING', NOW());






-- 12. BẢNG ROOM_IMG (15 Hình ảnh phòng)
INSERT INTO room_img (room_id, image_url, description, uploaded_at)
VALUES
    (1, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60', 'Ảnh phòng ngủ Standard Single', NOW()),
    (2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=60', 'Ảnh phòng ngủ Standard Double', NOW()),
    (3, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=60', 'Superior Single giường êm ái', NOW()),
    (4, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=60', 'Superior Double view đẹp', NOW()),
    (5, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&auto=format&fit=crop&q=60', 'Deluxe City View lộng lẫy ban ngày', NOW()),
    (6, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=60', 'Deluxe Ocean View biển xanh ngút ngàn', NOW()),
    (7, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop&q=60', 'Family Suite không gian ấm cúng cho cả gia đình', NOW()),
    (8, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&auto=format&fit=crop&q=60', 'Executive Suite lý tưởng cho công tác', NOW()),
    (9, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=60', 'President Suite hoàng gia', NOW()),
    (10, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60', 'Studio Room gọn gàng đa năng', NOW()),
    (11, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=60', 'Connecting Room tiện nghi vượt trội', NOW()),
    (12, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=60', 'Penthouse căn hộ áp mái ngắm hoàng hôn', NOW()),
    (13, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=60', 'Bungalow sân vườn xanh ngát', NOW()),
    (14, 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&auto=format&fit=crop&q=60', 'Bungalow sát biển hướng bình minh', NOW()),
    (15, 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&auto=format&fit=crop&q=60', 'Economy Room đơn giản tiết kiệm', NOW());

-- 13. BẢNG ROOM_STATE_HISTORY (15 Lịch sử thay đổi trạng thái phòng)
INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at)
VALUES
    (1, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 7, NOW()),
    (2, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 8, NOW()),
    (3, 'MAINTENANCE', 'AVAILABLE', 'MAINTENANCE', 10, NOW()),
    (4, 'AVAILABLE', 'OCCUPIED', 'CHECKIN', 4, NOW()),
    (5, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 9, NOW()),
    (6, 'OCCUPIED', 'DIRTY', 'CHECKOUT', 4, NOW()),
    (6, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 7, NOW()),
    (7, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 8, NOW()),
    (8, 'AVAILABLE', 'OCCUPIED', 'CHECKIN', 5, NOW()),
    (10, 'OCCUPIED', 'DIRTY', 'CHECKOUT', 4, NOW()),
    (11, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 9, NOW()),
    (12, 'AVAILABLE', 'MAINTENANCE', 'MAINTENANCE', 12, NOW()),
    (13, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 7, NOW()),
    (14, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 8, NOW()),
    (15, 'DIRTY', 'AVAILABLE', 'HOUSEKEEPING', 9, NOW());




ALTER TABLE users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('ACTIVE', 'BANNED', 'PENDING_VERIFICATION','INACTIVE'));
