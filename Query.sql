-- HMS development seed script for PostgreSQL.
-- Run after Spring Boot has created/updated tables with spring.jpa.hibernate.ddl-auto=update.
-- This file is idempotent enough for local development and avoids legacy tables/columns
-- that no longer exist in the current Java entities.

-- =========================================================
-- 1. Legacy schema cleanup
-- =========================================================
ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS user_name;

DO $$
DECLARE
    existing_tables TEXT;
BEGIN
    SELECT string_agg(format('%I', tablename), ', ')
    INTO existing_tables
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'room_state_history',
        'housekeeping_task',
        'room_equipments',
        'booking_room_guests',
        'booking_rooms',
        'room_img',
        'equipment_images',
        'repair_requests',
        'equipments',
        'invoices',
        'customer_feedback',
        'bookings',
        'customers',
        'room',
        'room_type',
        'user_notifications',
        'user_permissions',
        'role_permissions',
        'permission',
        'users',
        'roles',
        'services'
      ]);

    IF existing_tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || existing_tables || ' RESTART IDENTITY CASCADE';
    END IF;
END $$;

-- =========================================================
-- 2. Compatibility tables not always created by core entities
-- =========================================================
CREATE TABLE IF NOT EXISTS services (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(255) NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT,
    actor_username VARCHAR(100),
    actor_role VARCHAR(50),
    actor_email VARCHAR(120),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource_type VARCHAR(80),
    resource_id VARCHAR(80),
    resource_name VARCHAR(255),
    changes JSONB,
    ip_address VARCHAR(64),
    user_agent VARCHAR(512),
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(1000),
    request_id VARCHAR(100),
    previous_hash VARCHAR(64),
    row_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- 3. Enum check constraints synced with Java enums
-- =========================================================
DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL THEN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
        ALTER TABLE users ADD CONSTRAINT users_account_status_check
            CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'));

        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_work_status_check;
        ALTER TABLE users ADD CONSTRAINT users_work_status_check
            CHECK (work_status IN ('AVAILABLE', 'WORKING', 'OFF'));
    END IF;

    IF to_regclass('public.room') IS NOT NULL THEN
        ALTER TABLE room DROP CONSTRAINT IF EXISTS room_room_status_check;
        ALTER TABLE room ADD CONSTRAINT room_room_status_check
            CHECK (room_status IN (
                'AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING',
                'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'
            ));
    END IF;

    IF to_regclass('public.bookings') IS NOT NULL THEN
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
        ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
            CHECK (booking_status IN (
                'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'CHECKED_IN',
                'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'
            ));
    END IF;

    IF to_regclass('public.invoices') IS NOT NULL THEN
        ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
        ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_type_check
            CHECK (invoice_type IN ('ROOM', 'SURCHARGE'));

        ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
        ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
            CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));

        ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
        ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check
            CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'VNPAY', 'CARD', 'TRANSFER'));
    END IF;

    IF to_regclass('public.customers') IS NOT NULL THEN
        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check;
        ALTER TABLE customers ADD CONSTRAINT customers_status_check
            CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'));

        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_id_type_check;
        ALTER TABLE customers ADD CONSTRAINT customers_id_type_check
            CHECK (id_type IN ('CCCD', 'PASSPORT', 'OTHER'));
    END IF;

    IF to_regclass('public.customer_feedback') IS NOT NULL THEN
        ALTER TABLE customer_feedback DROP CONSTRAINT IF EXISTS customer_feedback_status_check;
        ALTER TABLE customer_feedback ADD CONSTRAINT customer_feedback_status_check
            CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED'));
    END IF;

    IF to_regclass('public.equipments') IS NOT NULL THEN
        ALTER TABLE equipments DROP CONSTRAINT IF EXISTS equipments_status_check;
        ALTER TABLE equipments ADD CONSTRAINT equipments_status_check
            CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN'));
    END IF;

    IF to_regclass('public.repair_requests') IS NOT NULL THEN
        ALTER TABLE repair_requests DROP CONSTRAINT IF EXISTS repair_requests_severity_check;
        ALTER TABLE repair_requests ADD CONSTRAINT repair_requests_severity_check
            CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

        ALTER TABLE repair_requests DROP CONSTRAINT IF EXISTS repair_requests_status_check;
        ALTER TABLE repair_requests ADD CONSTRAINT repair_requests_status_check
            CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
    END IF;

    IF to_regclass('public.housekeeping_task') IS NOT NULL THEN
        ALTER TABLE housekeeping_task DROP CONSTRAINT IF EXISTS housekeeping_task_task_status_check;
        ALTER TABLE housekeeping_task ADD CONSTRAINT housekeeping_task_task_status_check
            CHECK (task_status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SKIPPED'));
    END IF;

    IF to_regclass('public.room_state_history') IS NOT NULL THEN
        ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_triggered_by_process_check;
        ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_triggered_by_process_check
            CHECK (triggered_by_process IN (
                'CHECKIN', 'TASK_CLEANING', 'TASK_IN_PROGRESS', 'TASK_COMPLETION',
                'TASK_CANCELLATION', 'TASK_SKIPPED', 'TASK_MAINTENANCE'
            ));

        ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_previous_state_check;
        ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_previous_state_check
            CHECK (previous_state IN (
                'AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING',
                'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'
            ));

        ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_current_state_check;
        ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_current_state_check
            CHECK (current_state IN (
                'AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'RESERVED', 'CLEANING',
                'DIRTY', 'OCCUPIED', 'READY', 'OUT_OF_ORDER', 'CHECKOUT_PENDING'
            ));
    END IF;
END $$;

-- =========================================================
-- 4. Roles and permissions
-- =========================================================
INSERT INTO roles (role_name) VALUES
    ('ADMIN'),
    ('MANAGER'),
    ('CUSTOMER'),
    ('RECEPTIONIST'),
    ('MAINTENANCE'),
    ('HOUSEKEEPER')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permission (name) VALUES
    ('USER_VIEW'), ('USER_CREATE'), ('USER_UPDATE'), ('USER_DELETE'), ('USER_AUTHORIZE'),
    ('ROOM_VIEW'), ('ROOM_CREATE'), ('ROOM_UPDATE'), ('ROOM_DELETE'),
    ('ROOM_TYPE_VIEW'), ('ROOM_TYPE_CREATE'), ('ROOM_TYPE_UPDATE'), ('ROOM_TYPE_DELETE'),
    ('CUSTOMER_VIEW'), ('CUSTOMER_CREATE'), ('CUSTOMER_UPDATE'), ('CUSTOMER_DELETE'),
    ('BOOKING_VIEW'), ('BOOKING_CREATE'), ('BOOKING_UPDATE'), ('BOOKING_DELETE'), ('BOOKING_VIEW_OWN'),
    ('CHECKIN_VIEW'), ('CHECKIN_PROCESS'),
    ('HOUSEKEEPING_VIEW'), ('HOUSEKEEPING_CREATE'), ('HOUSEKEEPING_UPDATE'), ('HOUSEKEEPING_DELETE'),
    ('EQUIPMENT_VIEW'), ('EQUIPMENT_CREATE'), ('EQUIPMENT_UPDATE'), ('EQUIPMENT_DELETE'),
    ('MAINTENANCE_VIEW'), ('MAINTENANCE_CREATE'), ('MAINTENANCE_UPDATE'), ('MAINTENANCE_DELETE'),
    ('FEEDBACK_VIEW'), ('FEEDBACK_CREATE'), ('FEEDBACK_UPDATE'), ('FEEDBACK_DELETE'),
    ('FEEDBACK_VIEW_OWN'), ('FEEDBACK_UPDATE_OWN'), ('FEEDBACK_DELETE_OWN'),
    ('INVOICE_VIEW'), ('INVOICE_CREATE'), ('INVOICE_UPDATE'), ('INVOICE_DELETE'),
    ('DASHBOARD_VIEW'), ('AUDIT_LOG_VIEW')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permission p
WHERE r.role_name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permission p ON p.name IN (
    'DASHBOARD_VIEW',
    'ROOM_VIEW', 'ROOM_CREATE', 'ROOM_UPDATE', 'ROOM_DELETE',
    'ROOM_TYPE_VIEW', 'ROOM_TYPE_CREATE', 'ROOM_TYPE_UPDATE', 'ROOM_TYPE_DELETE',
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE',
    'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_DELETE',
    'CHECKIN_VIEW', 'CHECKIN_PROCESS',
    'HOUSEKEEPING_VIEW', 'HOUSEKEEPING_CREATE', 'HOUSEKEEPING_UPDATE', 'HOUSEKEEPING_DELETE',
    'EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_UPDATE', 'EQUIPMENT_DELETE',
    'MAINTENANCE_VIEW', 'MAINTENANCE_CREATE', 'MAINTENANCE_UPDATE', 'MAINTENANCE_DELETE',
    'FEEDBACK_VIEW', 'FEEDBACK_UPDATE', 'FEEDBACK_DELETE',
    'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE',
    'AUDIT_LOG_VIEW'
)
WHERE r.role_name = 'MANAGER';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permission p ON p.name IN (
    'ROOM_VIEW', 'ROOM_TYPE_VIEW',
    'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
    'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE',
    'CHECKIN_VIEW', 'CHECKIN_PROCESS',
    'HOUSEKEEPING_VIEW',
    'FEEDBACK_VIEW',
    'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE',
    'EQUIPMENT_VIEW'
)
WHERE r.role_name = 'RECEPTIONIST';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permission p ON p.name IN (
    'ROOM_VIEW',
    'HOUSEKEEPING_VIEW', 'HOUSEKEEPING_CREATE', 'HOUSEKEEPING_UPDATE',
    'EQUIPMENT_VIEW',
    'MAINTENANCE_VIEW', 'MAINTENANCE_CREATE'
)
WHERE r.role_name = 'HOUSEKEEPER';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permission p ON p.name IN (
    'ROOM_VIEW',
    'EQUIPMENT_VIEW', 'EQUIPMENT_CREATE', 'EQUIPMENT_UPDATE',
    'MAINTENANCE_VIEW', 'MAINTENANCE_CREATE', 'MAINTENANCE_UPDATE', 'MAINTENANCE_DELETE'
)
WHERE r.role_name = 'MAINTENANCE';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permission p ON p.name IN (
    'BOOKING_VIEW_OWN', 'BOOKING_CREATE',
    'ROOM_TYPE_VIEW',
    'FEEDBACK_CREATE', 'FEEDBACK_VIEW_OWN', 'FEEDBACK_UPDATE_OWN', 'FEEDBACK_DELETE_OWN',
    'INVOICE_VIEW'
)
WHERE r.role_name = 'CUSTOMER';

-- =========================================================
-- 5. Users and customers
-- Password for all seeded users: 123456a
-- =========================================================
INSERT INTO users (full_name, email, phone, password, account_status, work_status, enabled, created_at, role_id)
SELECT data.full_name, data.email, data.phone, data.password, data.account_status, data.work_status, TRUE, NOW(), r.id
FROM (
    VALUES
    ('HMS Administrator', 'admin@hms.com', '0901234560', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'ADMIN'),
    ('Manager One', 'manager1@hms.com', '0901234561', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'MANAGER'),
    ('Receptionist One', 'reception1@hms.com', '0901234563', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'RECEPTIONIST'),
    ('Housekeeper One', 'housekeeper1@hms.com', '0901234566', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'HOUSEKEEPER'),
    ('Housekeeper Two', 'housekeeper2@hms.com', '0901234567', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'WORKING', 'HOUSEKEEPER'),
    ('Maintenance One', 'maintenance1@hms.com', '0901234569', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'MAINTENANCE'),
    ('Customer One', 'customer1@gmail.com', '0908111222', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'CUSTOMER'),
    ('Customer Two', 'customer2@gmail.com', '0908333444', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'CUSTOMER'),
    ('Customer Three', 'customer3@gmail.com', '0908555666', '$2a$10$gudryckPzFK9Q79A71wkEehI75h5zGaNfczdfcKp3cMCIFrjY9ph.', 'ACTIVE', 'AVAILABLE', 'CUSTOMER')
) AS data(full_name, email, phone, password, account_status, work_status, role_name)
JOIN roles r ON r.role_name = data.role_name
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status) VALUES
    ('Customer One', 'customer1@gmail.com', '0908111222', 'CCCD', '001095001234', 'Vietnam', NOW(), 'ACTIVE'),
    ('Customer Two', 'customer2@gmail.com', '0908333444', 'CCCD', '001095001235', 'Vietnam', NOW(), 'ACTIVE'),
    ('Customer Three', 'customer3@gmail.com', '0908555666', 'CCCD', '001095001236', 'Vietnam', NOW(), 'ACTIVE'),
    ('John Doe', 'john.doe@gmail.com', '0908777888', 'PASSPORT', 'B1234567', 'USA', NOW(), 'ACTIVE'),
    ('Alice Smith', 'alice.smith@gmail.com', '0908999000', 'PASSPORT', 'A7654321', 'UK', NOW(), 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- =========================================================
-- 6. Room types, rooms, and room images
-- =========================================================
INSERT INTO room_type (type_name, description, base_price, max_guests, status) VALUES
    ('Standard Single', 'Standard room with one single bed', 500000, 1, 'ACTIVE'),
    ('Standard Double', 'Standard room with one double bed', 700000, 2, 'ACTIVE'),
    ('Superior Double', 'Superior double room', 1000000, 2, 'ACTIVE'),
    ('Deluxe City View', 'Deluxe room with city view', 1200000, 2, 'ACTIVE'),
    ('Family Suite', 'Suite for family stays', 2200000, 4, 'ACTIVE')
ON CONFLICT (type_name) DO NOTHING;

INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
SELECT data.room_number, rt.id, data.room_status, data.floor_number, data.description
FROM (
    VALUES
    ('101', 'Standard Single', 'AVAILABLE', 1, 'Standard single room 101'),
    ('102', 'Standard Single', 'DIRTY', 1, 'Recently checked-out room 102'),
    ('201', 'Standard Double', 'RESERVED', 2, 'Reserved standard double room 201'),
    ('202', 'Standard Double', 'OCCUPIED', 2, 'Occupied room 202'),
    ('301', 'Superior Double', 'READY', 3, 'Cleaned room awaiting front desk check'),
    ('302', 'Superior Double', 'CLEANING', 3, 'Room currently being cleaned'),
    ('401', 'Deluxe City View', 'MAINTENANCE', 4, 'Room under maintenance'),
    ('501', 'Family Suite', 'AVAILABLE', 5, 'Family suite 501')
) AS data(room_number, type_name, room_status, floor_number, description)
JOIN room_type rt ON rt.type_name = data.type_name
ON CONFLICT (room_number) DO NOTHING;

INSERT INTO room_img (room_id, image_url, description, uploaded_at)
SELECT r.id, data.image_url, data.description, NOW()
FROM (
    VALUES
    ('101', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800', 'Room 101'),
    ('102', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', 'Room 102'),
    ('201', 'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800', 'Room 201'),
    ('202', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Room 202'),
    ('301', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800', 'Room 301')
) AS data(room_number, image_url, description)
JOIN room r ON r.room_number = data.room_number;

-- =========================================================
-- 7. Bookings, allocated rooms, invoices, and feedback
-- =========================================================
INSERT INTO bookings (
    customer_id, room_id, type_id, price_per_night, quantity,
    check_in_date, check_out_date, booking_status, total_price, created_by, created_at,
    actual_check_in_time, actual_check_out_time, booking_for_other,
    guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality
)
SELECT c.id, r.id, rt.id, data.price_per_night, data.quantity,
       data.check_in_date::timestamp, data.check_out_date::timestamp, data.booking_status,
       data.total_price, u.id, NOW(),
       data.actual_check_in_time::timestamp, data.actual_check_out_time::timestamp, FALSE,
       c.full_name, c.email, c.phone, c.id_type::text, c.id_number_card, c.nationality
FROM (
    VALUES
    ('customer1@gmail.com', '102', 'Standard Single', 500000, 1, '2026-06-28 14:00:00', '2026-06-30 12:00:00', 'CHECKED_OUT', 1000000, '2026-06-28 14:20:00', '2026-06-30 11:40:00'),
    ('customer2@gmail.com', '202', 'Standard Double', 700000, 1, '2026-06-30 14:00:00', '2026-07-02 12:00:00', 'CHECKED_IN', 1400000, '2026-06-30 14:10:00', NULL),
    ('customer3@gmail.com', '201', 'Standard Double', 700000, 1, '2026-07-03 14:00:00', '2026-07-05 12:00:00', 'CONFIRMED', 1400000, NULL, NULL),
    ('john.doe@gmail.com', NULL, 'Family Suite', 2200000, 1, '2026-07-10 14:00:00', '2026-07-12 12:00:00', 'PENDING_PAYMENT', 4400000, NULL, NULL)
) AS data(customer_email, room_number, type_name, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, actual_check_in_time, actual_check_out_time)
JOIN customers c ON c.email = data.customer_email
JOIN room_type rt ON rt.type_name = data.type_name
JOIN users u ON u.email = 'admin@hms.com'
LEFT JOIN room r ON r.room_number = data.room_number;

INSERT INTO booking_rooms (booking_id, room_id)
SELECT b.id, b.room_id
FROM bookings b
WHERE b.room_id IS NOT NULL;

INSERT INTO booking_room_guests (booking_id, room_index, adults, children, infants)
SELECT b.id, 0, 2, 0, 0
FROM bookings b;

INSERT INTO invoices (
    booking_id, invoice_type, amount, payment_status, payment_method, paid_at,
    cash_received, change_amount, payment_confirmed, created_at, updated_at, note, additional_charges
)
SELECT b.id, 'ROOM', b.total_price,
       CASE WHEN b.booking_status IN ('CHECKED_OUT', 'CHECKED_IN', 'CONFIRMED') THEN 'PAID' ELSE 'PENDING' END,
       CASE WHEN b.booking_status IN ('CHECKED_OUT', 'CHECKED_IN', 'CONFIRMED') THEN 'CASH' ELSE NULL END,
       CASE WHEN b.booking_status IN ('CHECKED_OUT', 'CHECKED_IN', 'CONFIRMED') THEN NOW() ELSE NULL END,
       CASE WHEN b.booking_status IN ('CHECKED_OUT', 'CHECKED_IN', 'CONFIRMED') THEN b.total_price ELSE NULL END,
       0,
       b.booking_status IN ('CHECKED_OUT', 'CHECKED_IN', 'CONFIRMED'),
       NOW(),
       NOW(),
       'Seed room invoice',
       0
FROM bookings b;

INSERT INTO customer_feedback (booking_id, customer_id, rating, category, comment, status, created_at, reply, reply_at, deleted)
SELECT b.id, b.customer_id, 5, 'Room', 'Clean room and good service.', 'PENDING', NOW(), NULL, NULL, FALSE
FROM bookings b
WHERE b.booking_status = 'CHECKED_OUT'
LIMIT 1;

-- =========================================================
-- 8. Equipment, room equipment, maintenance, housekeeping
-- =========================================================
INSERT INTO equipments (equipment_name, equipment_code, description, status, created_at) VALUES
    ('Sony TV 55 inch', 'TV-55', 'Smart TV 4K', 'ACTIVE', NOW()),
    ('Daikin Air Conditioner', 'AC-15', 'Air conditioner 1.5 HP', 'ACTIVE', NOW()),
    ('Mini Fridge', 'FRIDGE-MINI', 'Mini fridge 50L', 'ACTIVE', NOW()),
    ('Safe Box', 'SAFE-BOX', 'Room safe box', 'ACTIVE', NOW()),
    ('Central AC', 'AC-CENTRAL', 'Central air conditioner', 'BROKEN', NOW())
ON CONFLICT (equipment_code) DO NOTHING;

INSERT INTO equipment_images (image_url, is_primary, equipment_id, created_at)
SELECT data.image_url, TRUE, e.id, NOW()
FROM (
    VALUES
    ('TV-55', '/uploads/equipments/sony_tv.jpg'),
    ('AC-15', '/uploads/equipments/daikin_ac.jpg'),
    ('FRIDGE-MINI', '/uploads/equipments/fridge.jpg'),
    ('SAFE-BOX', '/uploads/equipments/safe.jpg')
) AS data(equipment_code, image_url)
JOIN equipments e ON e.equipment_code = data.equipment_code;

INSERT INTO room_equipments (room_id, equipment_id, quantity, assigned_at)
SELECT r.id, e.id, data.quantity, NOW()
FROM (
    VALUES
    ('101', 'TV-55', 1),
    ('101', 'AC-15', 1),
    ('102', 'TV-55', 1),
    ('102', 'FRIDGE-MINI', 1),
    ('202', 'AC-15', 1),
    ('501', 'SAFE-BOX', 1)
) AS data(room_number, equipment_code, quantity)
JOIN room r ON r.room_number = data.room_number
JOIN equipments e ON e.equipment_code = data.equipment_code;

INSERT INTO repair_requests (
    room_id, equipment_id, reported_by, assigned_to, issue_title, issue_description,
    diagnosis, repair_result, severity, status, created_at, updated_at, completed_at, estimated_completion_time
)
SELECT r.id, e.id, reporter.id, assignee.id,
       'Air conditioner not cooling',
       'Guest reported that air conditioner is running but not cooling.',
       NULL,
       NULL,
       'HIGH',
       'ASSIGNED',
       NOW(),
       NOW(),
       NULL,
       NOW() + INTERVAL '1 day'
FROM room r
JOIN equipments e ON e.equipment_code = 'AC-CENTRAL'
JOIN users reporter ON reporter.email = 'reception1@hms.com'
JOIN users assignee ON assignee.email = 'maintenance1@hms.com'
WHERE r.room_number = '401';

INSERT INTO housekeeping_task (
    room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at
)
SELECT r.id, hk.id, admin_user.id, 'PENDING',
       'Clean room after checkout booking.',
       NULL, NULL, NOW(), NOW()
FROM room r
JOIN users hk ON hk.email = 'housekeeper1@hms.com'
JOIN users admin_user ON admin_user.email = 'admin@hms.com'
WHERE r.room_number = '102';

INSERT INTO housekeeping_task (
    room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at
)
SELECT r.id, hk.id, admin_user.id, 'IN_PROGRESS',
       'Room cleaning in progress.',
       NOW() - INTERVAL '20 minutes', NULL, NOW() - INTERVAL '20 minutes', NOW()
FROM room r
JOIN users hk ON hk.email = 'housekeeper2@hms.com'
JOIN users admin_user ON admin_user.email = 'admin@hms.com'
WHERE r.room_number = '302';

INSERT INTO room_state_history (
    room_id, previous_state, current_state, triggered_by_process, triggered_by_user,
    changed_at, reason, task_id
)
SELECT r.id, 'OCCUPIED', 'DIRTY', 'TASK_COMPLETION', u.id,
       NOW() - INTERVAL '1 hour', 'Checkout completed; room needs cleaning.', NULL
FROM room r
JOIN users u ON u.email = 'reception1@hms.com'
WHERE r.room_number = '102';

INSERT INTO room_state_history (
    room_id, previous_state, current_state, triggered_by_process, triggered_by_user,
    changed_at, reason, task_id
)
SELECT r.id, 'DIRTY', 'CLEANING', 'TASK_CLEANING', hk.id,
       NOW() - INTERVAL '20 minutes', 'Housekeeper started cleaning.', t.id
FROM room r
JOIN users hk ON hk.email = 'housekeeper2@hms.com'
JOIN housekeeping_task t ON t.room_id = r.id AND t.task_status = 'IN_PROGRESS'
WHERE r.room_number = '302';

-- =========================================================
-- 9. Services, notifications, indexes, audit guard
-- =========================================================
INSERT INTO services (service_name, price, is_available) VALUES
    ('Coca Cola Minibar', 25000, TRUE),
    ('Heineken Minibar', 40000, TRUE),
    ('Aquafina Water', 15000, TRUE),
    ('Laundry per kg', 50000, TRUE),
    ('Room Service Tea', 30000, TRUE)
ON CONFLICT (service_name) DO NOTHING;

INSERT INTO user_notifications (recipient_id, title, message, target_url, read_flag, created_at)
SELECT u.id, 'Welcome to HMS', 'Your seed account is ready.', '/dashboard', FALSE, NOW()
FROM users u
WHERE u.email IN ('admin@hms.com', 'housekeeper1@hms.com');

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_booking_rooms_booking ON booking_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_rooms_room ON booking_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_booking_room_guests_booking ON booking_room_guests(booking_id);
CREATE INDEX IF NOT EXISTS idx_room_equipments_room ON room_equipments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_equipments_equipment ON room_equipments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON customer_feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_booking_id ON customer_feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON customer_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_housekeeping_task_room ON housekeeping_task(room_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_task_assigned_to ON housekeeping_task(assigned_to);
CREATE INDEX IF NOT EXISTS idx_housekeeping_task_status ON housekeeping_task(task_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes_gin ON audit_logs USING GIN (changes);

CREATE OR REPLACE FUNCTION prevent_audit_logs_update_delete()
RETURNS trigger AS $audit_guard$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only';
END;
$audit_guard$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_update ON audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_update_delete();

DROP TRIGGER IF EXISTS trg_prevent_audit_logs_delete ON audit_logs;
CREATE TRIGGER trg_prevent_audit_logs_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_update_delete();

-- Quick checks
SELECT 'roles' AS table_name, count(*) AS total FROM roles
UNION ALL SELECT 'permission', count(*) FROM permission
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'room_type', count(*) FROM room_type
UNION ALL SELECT 'room', count(*) FROM room
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'housekeeping_task', count(*) FROM housekeeping_task;
