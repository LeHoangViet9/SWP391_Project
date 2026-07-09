-- =============================================================================
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
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check CHECK (payment_method IN ('CASH', 'CARD', 'VNPAY', 'TRANSFER'));

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_id_type_check;
ALTER TABLE customers ADD CONSTRAINT customers_id_type_check CHECK (id_type IN ('CCCD', 'PASSPORT', 'OTHER'));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_triggered_by_process_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_triggered_by_process_check
    CHECK (triggered_by_process IN (
                                    'TASK_CLEANING', 'TASK_IN_PROGRESS', 'TASK_COMPLETION',
                                    'TASK_CANCELLATION', 'TASK_SKIPPED', 'TASK_MAINTENANCE'
        ));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_previous_state_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_previous_state_check
    CHECK (previous_state IN (
                              'AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED',
                              'CLEANING', 'DIRTY', 'OCCUPIED', 'READY',
                              'OUT_OF_ORDER', 'CHECKOUT_PENDING'
        ));

ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_current_state_check;
ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_current_state_check
    CHECK (current_state IN (
                             'AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED',
                             'CLEANING', 'DIRTY', 'OCCUPIED', 'READY',
                             'OUT_OF_ORDER', 'CHECKOUT_PENDING'
        ));

-- =============================================================================
-- 4. CHÈN DỮ LIỆU DANH MỤC CƠ BẢN (ROLES & PERMISSIONS)
-- =============================================================================
INSERT INTO roles (role_name) VALUES
    ('ADMIN'), ('MANAGER'), ('CUSTOMER'), ('RECEPTIONIST'), ('MAINTENANCE'), ('HOUSEKEEPER');

INSERT INTO permission (name) VALUES
    ('USER_VIEW'), ('USER_CREATE'), ('USER_UPDATE'), ('USER_DELETE'), ('USER_AUTHORIZE'),
    ('ROOM_VIEW'), ('ROOM_CREATE'), ('ROOM_UPDATE'), ('ROOM_DELETE'),
    ('ROOM_TYPE_VIEW'), ('ROOM_TYPE_CREATE'), ('ROOM_TYPE_UPDATE'), ('ROOM_TYPE_DELETE'),
    ('CUSTOMER_VIEW'), ('CUSTOMER_CREATE'), ('CUSTOMER_UPDATE'), ('CUSTOMER_DELETE'),
    ('BOOKING_VIEW'), ('BOOKING_CREATE'), ('BOOKING_UPDATE'), ('BOOKING_DELETE'), ('BOOKING_VIEW_OWN'),
    ('HOUSEKEEPING_VIEW'), ('HOUSEKEEPING_CREATE'), ('HOUSEKEEPING_UPDATE'), ('HOUSEKEEPING_DELETE'),
    ('EQUIPMENT_VIEW'), ('EQUIPMENT_CREATE'), ('EQUIPMENT_UPDATE'), ('EQUIPMENT_DELETE'),
    ('MAINTENANCE_VIEW'), ('MAINTENANCE_CREATE'), ('MAINTENANCE_UPDATE'), ('MAINTENANCE_DELETE'),
    ('FEEDBACK_VIEW'), ('FEEDBACK_CREATE'), ('FEEDBACK_UPDATE'), ('FEEDBACK_DELETE'),
    ('FEEDBACK_VIEW_OWN'), ('FEEDBACK_UPDATE_OWN'), ('FEEDBACK_DELETE_OWN'),
    ('INVOICE_VIEW'), ('INVOICE_CREATE'), ('INVOICE_UPDATE'), ('INVOICE_DELETE')
ON CONFLICT (name) DO NOTHING;

-- Phân quyền cho từng Role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p WHERE r.role_name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p
WHERE r.role_name = 'MANAGER' AND p.name NOT IN ('BOOKING_VIEW_OWN', 'USER_AUTHORIZE');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p
WHERE r.role_name = 'RECEPTIONIST' AND p.name IN (
    'ROOM_VIEW', 'ROOM_TYPE_VIEW', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
    'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE',
    'FEEDBACK_VIEW', 'EQUIPMENT_VIEW'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p
WHERE r.role_name = 'HOUSEKEEPER' AND p.name IN (
    'ROOM_VIEW', 'ROOM_UPDATE', 'HOUSEKEEPING_VIEW', 'HOUSEKEEPING_CREATE', 'HOUSEKEEPING_UPDATE',
    'EQUIPMENT_VIEW', 'MAINTENANCE_VIEW', 'MAINTENANCE_CREATE'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p
WHERE r.role_name = 'MAINTENANCE' AND p.name IN (
    'ROOM_VIEW', 'EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_UPDATE',
    'MAINTENANCE_VIEW', 'MAINTENANCE_CREATE', 'MAINTENANCE_UPDATE', 'MAINTENANCE_DELETE'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permission p
WHERE r.role_name = 'CUSTOMER' AND p.name IN (
    'BOOKING_VIEW_OWN', 'ROOM_TYPE_VIEW', 'FEEDBACK_CREATE', 'FEEDBACK_VIEW_OWN',
    'FEEDBACK_UPDATE_OWN', 'FEEDBACK_DELETE_OWN', 'INVOICE_VIEW'
);

-- =============================================================================
-- 5. CHÈN DỮ LIỆU TÀI KHOẢN & KHÁCH HÀNG (USERS & CUSTOMERS)
-- =============================================================================
-- Mật khẩu: 123456a
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
    ('Nguyễn Văn Hùng', 'maintenance1@hms.com', '0901234569', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Trần Văn Mạnh', 'maintenance2@hms.com', '0901234570', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 5),
    ('Phạm Văn Dũng', 'customer1@gmail.com', '0908111222', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Lê Thị Bình', 'customer2@gmail.com', '0908333444', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Nguyễn Hoàng Cường', 'customer3@gmail.com', '0908555666', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('John Doe', 'john.doe@gmail.com', '0908777888', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Alice Smith', 'alice.smith@gmail.com', '0908999000', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Phạm Minh Hùng', 'hung.pham@gmail.com', '0902111333', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Vũ Thị Lan', 'lan.vu@gmail.com', '0902444555', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3),
    ('Đỗ Quốc Anh', 'anh.do@gmail.com', '0902777888', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', NOW(), 3);

INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status) VALUES
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

-- =============================================================================
-- 6. CHÈN DỮ LIỆU PHÒNG & LOẠI PHÒNG (ROOM_TYPE & ROOM)
-- =============================================================================
INSERT INTO room_type (type_name, description, base_price, max_guests, status) VALUES
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

INSERT INTO room (room_number, room_type_id, room_status, floor_number, description) VALUES
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

INSERT INTO room_img (room_id, image_url, description, uploaded_at) VALUES
    (1, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800', 'Ảnh phòng Standard Single', NOW()),
    (2, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 'Ảnh phòng Standard Double', NOW()),
    (3, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800', 'Superior Single giường êm ái', NOW()),
    (4, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'Superior Double view đẹp', NOW()),
    (5, 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800', 'Deluxe City View lộng lẫy', NOW()),
    (6, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', 'Deluxe Ocean View biển xanh', NOW()),
    (7, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800', 'Family Suite ấm cúng', NOW()),
    (8, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', 'Executive Suite lý tưởng', NOW()),
    (9, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800', 'President Suite hoàng gia', NOW()),
    (10, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Studio Room đa năng', NOW()),
    (11, 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', 'Connecting Room tiện nghi', NOW()),
    (12, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', 'Penthouse ngắm hoàng hôn', NOW()),
    (13, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Bungalow sân vườn', NOW()),
    (14, 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 'Bungalow sát biển', NOW()),
    (15, 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800', 'Economy Room tiết kiệm', NOW());

INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at) VALUES
    (1, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 7, NOW()),
    (2, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 8, NOW()),
    (3, 'MAINTENANCE', 'AVAILABLE', 'TASK_MAINTENANCE', 10, NOW()),
    (4, 'AVAILABLE', 'OCCUPIED', 'TASK_IN_PROGRESS', 4, NOW()),
    (5, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 9, NOW()),
    (6, 'OCCUPIED', 'DIRTY', 'TASK_COMPLETION', 4, NOW()),
    (6, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 7, NOW()),
    (7, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 8, NOW()),
    (8, 'AVAILABLE', 'OCCUPIED', 'TASK_IN_PROGRESS', 5, NOW()),
    (10, 'OCCUPIED', 'DIRTY', 'TASK_COMPLETION', 4, NOW()),
    (11, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 9, NOW()),
    (12, 'AVAILABLE', 'MAINTENANCE', 'TASK_MAINTENANCE', 12, NOW()),
    (13, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 7, NOW()),
    (14, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 8, NOW()),
    (15, 'DIRTY', 'AVAILABLE', 'TASK_CLEANING', 9, NOW());

-- =============================================================================
-- 7. CHÈN DỮ LIỆU ĐẶT PHÒNG & HÓA ĐƠN & PHẢN HỒI (BOOKINGS & INVOICES & FEEDBACK)
-- =============================================================================
INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at) VALUES
    (1, 1, 1, 500000.00, 1, '2026-06-15 14:00:00', '2026-06-17 12:00:00', 'CHECKED_OUT', 1000000.00, 1, NOW()),
    (2, 2, 2, 700000.00, 1, '2026-06-20 14:00:00', '2026-06-22 12:00:00', 'CHECKED_OUT', 1400000.00, 1, NOW()),
    (3, 4, 4, 1000000.00, 1, '2026-06-10 14:00:00', '2026-06-12 12:00:00', 'CHECKED_OUT', 2000000.00, 1, NOW()),
    (4, 5, 5, 1200000.00, 1, '2026-06-11 14:00:00', '2026-06-13 12:00:00', 'CHECKED_OUT', 2400000.00, 1, NOW()),
    (5, 6, 6, 1500000.00, 1, '2026-06-01 14:00:00', '2026-06-03 12:00:00', 'CHECKED_OUT', 3000000.00, 1, NOW()),
    (6, 3, 3, 800000.00, 1, '2026-06-02 14:00:00', '2026-06-04 12:00:00', 'CHECKED_OUT', 1600000.00, 1, NOW()),
    (7, 8, 8, 3000000.00, 1, '2026-06-08 14:00:00', '2026-06-10 12:00:00', 'CHECKED_OUT', 6000000.00, 1, NOW()),
    (8, 9, 9, 8000000.00, 1, '2026-06-25 14:00:00', '2026-06-28 12:00:00', 'CONFIRMED', 24000000.00, 1, NOW()),
    (9, NULL, 6, 1500000.00, 1, '2026-06-18 14:00:00', '2026-06-20 12:00:00', 'PENDING', 3000000.00, 1, NOW()),
    (10, NULL, 7, 2200000.00, 1, '2026-06-19 14:00:00', '2026-06-21 12:00:00', 'PENDING', 4400000.00, 1, NOW()),
    (11, 10, 10, 1100000.00, 1, '2026-06-05 14:00:00', '2026-06-06 12:00:00', 'CHECKED_OUT', 1100000.00, 1, NOW()),
    (12, 11, 11, 2000000.00, 1, '2026-06-06 14:00:00', '2026-06-08 12:00:00', 'CHECKED_OUT', 4000000.00, 1, NOW()),
    (13, NULL, 12, 12000000.00, 1, '2026-07-01 14:00:00', '2026-07-05 12:00:00', 'PENDING', 48000000.00, 1, NOW()),
    (14, 15, 15, 400000.00, 1, '2026-06-12 14:00:00', '2026-06-14 12:00:00', 'CHECKED_OUT', 800000.00, 1, NOW()),
    (15, NULL, 13, 1800000.00, 1, '2026-06-15 14:00:00', '2026-06-16 12:00:00', 'CANCELLED', 1800000.00, 1, NOW());

INSERT INTO invoices (booking_id, amount, payment_status, payment_method, paid_at, invoice_type) VALUES
                                                                                                     (1, 1000000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (2, 1400000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (3, 2000000.00, 'PAID', 'CASH', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (4, 2400000.00, 'PAID', 'TRANSFER', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (5, 3000000.00, 'PAID', 'CARD', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (6, 1600000.00, 'PAID', 'CASH', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (7, 6000000.00, 'PAID', 'TRANSFER', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (8, 2400000.00, 'PAID', 'CARD', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (9, 3000000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (10, 4400000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (11, 1100000.00, 'PAID', 'CASH', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (12, 4000000.00, 'PAID', 'TRANSFER', '2026-07-09 22:00:00', 'ROOM'),
                                                                                                     (13, 4800000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (14, 8000000.00, 'PENDING', NULL, NULL, 'ROOM'),
                                                                                                     (15, 1800000.00, 'CANCELLED', NULL, NULL, 'ROOM');


INSERT INTO customer_feedback (booking_id, customer_id, rating, category, comment, status, deleted) VALUES
                                                                                                        (5, 5, 5, 'Room', 'Phòng Suite view biển rất đẹp, thiết bị hiện đại...', 'PENDING', false),
                                                                                                        (6, 6, 4, 'Cleanliness', 'Khách sạn sạch sẽ, nhân viên dọn phòng kỹ...', 'PENDING', false),
                                                                                                        (7, 7, 3, 'Service', 'Đồ ăn sáng hơi ít món, cần đa dạng hơn...', 'PENDING', false),
                                                                                                        (11, 11, 2, 'Staff', 'Nhân viên lễ tân lúc check-in hơi chậm...', 'PENDING', false),
                                                                                                        (12, 12, 1, 'Room', 'Phòng bị hỏng điều hòa, gọi sửa hơi lâu...', 'PENDING', false);


-- =============================================================================
-- 8. CHÈN DỮ LIỆU THIẾT BỊ & BẢO TRÌ (EQUIPMENTS & REPAIRS)
-- =============================================================================
INSERT INTO equipments (equipment_name, equipment_code, description, status, created_at) VALUES
    ('Tivi Sony 55 inch', 'TV-101', 'Tivi thông minh Sony 4K', 'ACTIVE', NOW()),
    ('Điều hòa Daikin 1.5 HP', 'AC-101', 'Điều hòa không khí Daikin', 'ACTIVE', NOW()),
    ('Tủ lạnh mini Electrolux', 'RF-101', 'Tủ lạnh mini 50 lít', 'ACTIVE', NOW()),
    ('Máy sấy tóc Panasonic', 'HD-101', 'Máy sấy tóc 1200W', 'ACTIVE', NOW()),
    ('Điều hòa Panasonic 2 HP', 'AC-202', 'Điều hòa Inverter Panasonic', 'ACTIVE', NOW()),
    ('Tivi Samsung 65 inch', 'TV-301', 'Tivi QLED Samsung', 'ACTIVE', NOW()),
    ('Điều hòa Daikin 2.5 HP', 'AC-301', 'Điều hòa công suất lớn Daikin', 'ACTIVE', NOW()),
    ('Bình nóng lạnh Rossi', 'WH-301', 'Bình nước nóng Rossi 30 lít', 'ACTIVE', NOW()),
    ('Tivi Sony 75 inch', 'TV-501', 'Tivi Sony Bravia OLED', 'ACTIVE', NOW()),
    ('Điều hòa trung tâm Daikin', 'AC-701', 'Hệ thống điều hòa trung tâm', 'BROKEN', NOW()),
    ('Tủ lạnh Panasonic 150 lít', 'RF-701', 'Tủ lạnh hai cánh Panasonic', 'ACTIVE', NOW()),
    ('Tivi LG 43 inch', 'TV-103', 'Tivi LG Smart Full HD', 'ACTIVE', NOW()),
    ('Điều hòa Midea 1 HP', 'AC-103', 'Điều hòa Midea tiết kiệm điện', 'ACTIVE', NOW()),
    ('Ấm siêu tốc Philips', 'KT-101', 'Ấm đun nước siêu tốc 1.8 lít', 'ACTIVE', NOW()),
    ('Két sắt chống cháy Honeywell', 'SF-501', 'Két sắt vân tay Honeywell', 'ACTIVE', NOW());

INSERT INTO equipment_images (image_url, is_primary, equipment_id, created_at) VALUES
    ('/uploads/equipments/sony_tv.jpg', TRUE, 1, NOW()),
    ('/uploads/equipments/daikin_ac.jpg', TRUE, 2, NOW()),
    ('/uploads/equipments/electrolux_fridge.jpg', TRUE, 3, NOW()),
    ('/uploads/equipments/panasonic_dryer.jpg', TRUE, 4, NOW()),
    ('/uploads/equipments/panasonic_ac.jpg', TRUE, 5, NOW()),
    ('/uploads/equipments/samsung_tv.jpg', TRUE, 6, NOW()),
    ('/uploads/equipments/daikin_ac_large.jpg', TRUE, 7, NOW()),
    ('/uploads/equipments/rossi_heater.jpg', TRUE, 8, NOW()),
    ('/uploads/equipments/sony_oled.jpg', TRUE, 9, NOW()),
    ('/uploads/equipments/daikin_central.jpg', TRUE, 10, NOW()),
    ('/uploads/equipments/panasonic_fridge.jpg', TRUE, 11, NOW()),
    ('/uploads/equipments/lg_tv.jpg', TRUE, 12, NOW()),
    ('/uploads/equipments/midea_ac.jpg', TRUE, 13, NOW()),
    ('/uploads/equipments/philips_kettle.jpg', TRUE, 14, NOW()),
    ('/uploads/equipments/honeywell_safe.jpg', TRUE, 15, NOW());

INSERT INTO repair_requests (room_id, equipment_id, reported_by, assigned_to, issue_title, issue_description, diagnosis, repair_result, severity, status, created_at) VALUES
    (1, 1, 4, 10, 'Lỗi Tivi không kết nối được Wifi', 'Khách báo tivi Sony phòng 101 không thể kết nối mạng.', 'Lỗi cài đặt phần mềm mạng.', 'Đã reset cài đặt mạng.', 'LOW', 'COMPLETED', NOW()),
    (1, 2, 4, 10, 'Điều hòa rò rỉ nước', 'Điều hòa Daikin phòng 101 bị chảy nước từ cục lạnh.', 'Đường ống thoát nước bị tắc.', 'Đã vệ sinh ống thoát nước.', 'MEDIUM', 'COMPLETED', NOW()),
    (4, 5, 4, 11, 'Điều hòa không mát', 'Điều hòa phòng 202 bật nhưng chỉ có gió, không mát.', 'Rò rỉ gas ở đầu nối ống đồng.', 'Đã hàn chỗ rò rỉ và nạp gas.', 'HIGH', 'COMPLETED', NOW()),
    (12, 10, 4, 12, 'Hỏng block điều hòa trung tâm', 'Điều hòa trung tâm phòng 701 ngừng hoạt động.', 'Block điều hòa bị cháy do quá tải.', NULL, 'CRITICAL', 'IN_PROGRESS', NOW()),
    (5, 6, 7, 10, 'Tivi phòng 301 bị sọc màn hình', 'Màn hình tivi phòng 301 có sọc dọc màu xanh.', NULL, NULL, 'HIGH', 'ASSIGNED', NOW()),
    (1, 14, 7, 11, 'Ấm siêu tốc phòng 101 hỏng đế', 'Đế tiếp điện ấm siêu tốc bị cháy khét.', 'Chập điện ở đế do tràn nước.', 'Đã thay đế mới.', 'LOW', 'COMPLETED', NOW()),
    (9, 15, 4, NULL, 'Két sắt phòng 501 hết pin', 'Khách báo két sắt không nhận mật khẩu.', NULL, NULL, 'LOW', 'PENDING', NOW()),
    (2, NULL, 7, 12, 'Bóng đèn trần phòng 102 bị cháy', 'Hỏng 2 bóng đèn LED âm trần.', 'Bóng đèn đã hết tuổi thọ.', 'Đã thay mới.', 'LOW', 'COMPLETED', NOW()),
    (3, NULL, 7, NULL, 'Khóa cửa phòng 201 bị kẹt', 'Khóa từ quét thẻ khó nhận.', NULL, NULL, 'MEDIUM', 'PENDING', NOW()),
    (5, 8, 4, 11, 'Bình nóng lạnh phòng 301 rò điện', 'Đèn chống giật nhấp nháy đỏ liên tục.', NULL, NULL, 'CRITICAL', 'ASSIGNED', NOW());


-- =============================================================================
-- 9. TẠO INDEXES TỐI ƯU TRUY VẤN
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);

-- =============================================================================
-- 10. MIGRATION: Thêm cột denied_by_ids vào repair_requests
--     Dùng để lưu danh sách maintenance đã từ chối (dạng "5,8,12")
-- =============================================================================
ALTER TABLE repair_requests
    ADD COLUMN IF NOT EXISTS denied_by_ids VARCHAR(500) DEFAULT '';

