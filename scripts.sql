create database hms_db;

-- INSERT CHO BẢNG ROLE
INSERT INTO roles (role_name, permissions) VALUES
                                               ( 'ADMIN', 'SYSTEM_ALL,USER_CRUD,ROOM_CRUD,EQUIPMENT_CRUD,VIEW_LOGS'),
                                               ('MANAGER', 'ROOM_VIEW,CUSTOMER_CRUD,BOOKING_CRUD,BILLING_CRUD,TASK_ASSIGN,REPORT_VIEW'),
                                               ('RECEPTIONIST', 'ROOM_VIEW,CUSTOMER_CRUD,BOOKING_CRUD,BILLING_CRUD'),
                                               ( 'HOUSEKEEPER', 'ROOM_VIEW,TASK_VIEW,TASK_UPDATE,DAMAGE_REPORT'),
                                               ( 'TECHNICIAN', 'ROOM_VIEW,REPAIR_VIEW,REPAIR_UPDATE,EQUIPMENT_CHECK');

-- 2. Bảng Loại phòng (room_type)
INSERT INTO room_type (id, type_name, description, base_price, max_guests, status) VALUES
                                                                                       (1, 'Standard Single', 'Phòng đơn tiêu chuẩn, đầy đủ tiện nghi cơ bản', 350000.00, 1, 'ACTIVE'),
                                                                                       (2, 'Deluxe Double', 'Phòng đôi cao cấp, view thành phố thoáng đãng', 750000.00, 2, 'ACTIVE'),
                                                                                       (3, 'VIP Suite', 'Phòng hạng sang tổng thống, không gian rộng rãi, tiện ích chuẩn 5 sao', 1500000.00, 4, 'ACTIVE');

-- 3. Bảng Khách hàng (customers)
INSERT INTO customers (id, full_name, email, phone, id_type, id_number_card, nationality, created_at, status) VALUES
                                                                                                                  (1, 'Nguyễn Văn A', 'nguyenvana@gmail.com', '0912345678', 'CCCD', '001095001234', 'Vietnam', CURRENT_TIMESTAMP, 'ACTIVE'),
                                                                                                                  (2, 'Trần Thị B', 'tranthib@gmail.com', '0987654321', 'PASSPORT', 'B1234567', 'Vietnam', CURRENT_TIMESTAMP, 'ACTIVE'),
                                                                                                                  (3, 'John Smith', 'johnsmith@gmail.com', '0901112223', 'CCCD', '002095009999', 'USA', CURRENT_TIMESTAMP, 'ACTIVE');

-- 4. Bảng Trang thiết bị (equipments)
-- 4. Bảng Trang thiết bị (equipments)
INSERT INTO equipments (id, equipment_name, equipment_code, location, description, image_url, status, created_at) VALUES
                                                                                                                      (1, 'Điều hòa Daikin 12000BTU', 'EQ-AC-001', 'Phòng 101', 'Điều hòa một chiều chạy tốt', 'https://res.cloudinary.com/demo/image/upload/v1/equip/ac.jpg', 'ACTIVE', CURRENT_TIMESTAMP),
                                                                                                                      (2, 'Tivi Sony 4K 55 inch', 'EQ-TV-002', 'Phòng 102', 'Màn hình sắc nét, kết nối mạng ổn định', 'https://res.cloudinary.com/demo/image/upload/v1/equip/tv.jpg', 'ACTIVE', CURRENT_TIMESTAMP),
                                                                                                                      (3, 'Tủ lạnh mini Electrolux', 'EQ-REF-003', 'Phòng 201', 'Tủ làm lạnh nhanh, không ồn', 'https://res.cloudinary.com/demo/image/upload/v1/equip/ref.jpg', 'MAINTENANCE', CURRENT_TIMESTAMP);


-- ==========================================
-- BƯỚC 2: CHÈN CÁC BẢNG CÓ KHÓA NGOẠI CẤP 1
-- ==========================================

-- 5. Bảng Tài khoản Nhân viên (users) - Liên kết tới bảng roles
INSERT INTO users (id, user_name, full_name, email, phone, password, account_status, created_at, role_id) VALUES
                                                                                                              (1, 'admin_hms', 'Lê Hoàng Việt', 'vietlh@hms.com', '0900000001', '$2a$10$X...', 'ACTIVE', CURRENT_TIMESTAMP, 1),
                                                                                                              (2, 'reception_an', 'Nguyễn Thúy An', 'annt@hms.com', '0900000002', '$2a$10$X...', 'ACTIVE', CURRENT_TIMESTAMP, 3);

-- 6. Bảng Phòng (room) - Liên kết tới bảng room_type
INSERT INTO room (id, room_number, room_type_id, room_status, floor_number, description, image_room) VALUES
                                                                                                         (1, '101', 1, 'AVAILABLE', 1, 'Phòng đơn tầng 1 yên tĩnh', 'https://res.cloudinary.com/demo/image/upload/v1/rooms/room101.jpg'),
                                                                                                         (2, '102', 2, 'AVAILABLE', 1, 'Phòng đôi rộng rãi tầng 1', 'https://res.cloudinary.com/demo/image/upload/v1/rooms/room102.jpg'),
                                                                                                         (3, '201', 3, 'OCCUPIED', 2, 'Phòng VIP đẳng cấp tầng 2', 'https://res.cloudinary.com/demo/image/upload/v1/rooms/room201.jpg');


-- ==========================================
-- BƯỚC 3: CHÈN CÁC BẢNG PHỤ THUỘC SÂU (Nhiều khóa ngoại)
-- ==========================================

-- 7. Bảng Đơn đặt phòng (bookings) - Liên kết tới customers, room, room_type, users
INSERT INTO bookings (id, customer_id, room_id, type_id, price_per_night, check_in_date, check_out_date, booking_status, total_price, created_by, created_at) VALUES
                                                                                                                                                                  (1, 1, 1, 1, 350000.00, '2026-06-05 14:00:00', '2026-06-07 12:00:00', 'CONFIRMED', 700000.00, 2, CURRENT_TIMESTAMP),
                                                                                                                                                                  (2, 2, 3, 3, 1500000.00, '2026-06-10 14:00:00', '2026-06-11 12:00:00', 'PENDING', 1500000.00, 2, CURRENT_TIMESTAMP),
                                                                                                                                                                  (3, 3, 2, 2, 750000.00, '2026-06-01 14:00:00', '2026-06-03 12:00:00', 'CHECKED_OUT', 1500000.00, 2, CURRENT_TIMESTAMP);

-- 8. Bảng Hóa đơn (invoices) - Liên kết tới bảng bookings
INSERT INTO invoices (id, booking_id, amount, payment_status, payment_method, paid_at) VALUES
                                                                                           (1, 1, 700000.00, 'UNPAID', null, null),
                                                                                           (2, 3, 1500000.00, 'PAID', 'CASH', '2026-06-03 11:45:00');

-- Cập nhật lại chuỗi giá trị tự tăng (Sequence) cho PostgreSQL để không bị lỗi trùng ID khi bạn thực hiện tính năng tạo mới (INSERT) từ ứng dụng Spring Boot
SELECT setval(pg_get_serial_sequence('roles', 'id'), coalesce(max(id),0) + 1, false) FROM roles;
SELECT setval(pg_get_serial_sequence('room_type', 'id'), coalesce(max(id),0) + 1, false) FROM room_type;
SELECT setval(pg_get_serial_sequence('customers', 'id'), coalesce(max(id),0) + 1, false) FROM customers;
SELECT setval(pg_get_serial_sequence('equipments', 'id'), coalesce(max(id),0) + 1, false) FROM equipments;
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id),0) + 1, false) FROM users;
SELECT setval(pg_get_serial_sequence('room', 'id'), coalesce(max(id),0) + 1, false) FROM room;
SELECT setval(pg_get_serial_sequence('bookings', 'id'), coalesce(max(id),0) + 1, false) FROM bookings;
SELECT setval(pg_get_serial_sequence('invoices', 'id'), coalesce(max(id),0) + 1, false) FROM invoices;



