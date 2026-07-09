-- Bulk test data for HMS (PostgreSQL)
-- Adds 300 rooms, 650 customers/bookings and matching invoices.
-- Safe to run more than once: the marker table prevents duplicate seed runs.

BEGIN;@@

-- Keep database constraints aligned with the current Java enums.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;@@
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check CHECK (booking_status IN (
    'PENDING_PAYMENT', 'PENDING_CHECK_IN', 'CHECKED_IN', 'CHECKED_OUT',
    'CANCELLED', 'NO_SHOW', 'PENDING', 'CONFIRMED'
));@@

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;@@
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
    CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'CANCELLED'));@@

CREATE TABLE IF NOT EXISTS hms_test_seed_runs (
    seed_name VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);@@

DO $$
DECLARE
    seed CONSTANT VARCHAR := 'bulk-checkin-checkout-v1';
    room_type_ids BIGINT[];
    room_type_id BIGINT;
    room_id BIGINT;
    customer_id BIGINT;
    booking_id BIGINT;
    creator_id BIGINT;
    price NUMERIC(14,2);
    room_status VARCHAR(30);
    booking_status VARCHAR(30);
    check_in_at TIMESTAMP;
    check_out_at TIMESTAMP;
    total NUMERIC(14,2);
    i INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM hms_test_seed_runs WHERE seed_name = seed) THEN
        RAISE NOTICE 'Seed % already exists; no rows were added.', seed;
        RETURN;
    END IF;

    SELECT array_agg(id ORDER BY id) INTO room_type_ids FROM room_type WHERE status = 'ACTIVE';
    IF room_type_ids IS NULL OR array_length(room_type_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No ACTIVE room types found. Create room types before running this seed.';
    END IF;

    SELECT id INTO creator_id FROM users
    WHERE email IN ('reception1@hms.com', 'admin@hms.com')
    ORDER BY CASE WHEN email = 'reception1@hms.com' THEN 0 ELSE 1 END LIMIT 1;
    IF creator_id IS NULL THEN
        SELECT id INTO creator_id FROM users ORDER BY id LIMIT 1;
    END IF;

    -- 300 physical rooms across floors 9-23. Prefix T avoids collisions with real rooms.
    FOR i IN 1..300 LOOP
        room_type_id := room_type_ids[((i - 1) % array_length(room_type_ids, 1)) + 1];
        room_status := CASE
            WHEN i <= 100 THEN 'RESERVED'
            WHEN i <= 200 THEN 'OCCUPIED'
            WHEN i <= 220 THEN 'CHECKOUT_PENDING'
            WHEN i <= 255 THEN 'AVAILABLE'
            WHEN i <= 270 THEN 'READY'
            WHEN i <= 282 THEN 'DIRTY'
            WHEN i <= 292 THEN 'CLEANING'
            ELSE 'MAINTENANCE'
        END;

        INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
        VALUES (
            'T' || lpad(i::text, 3, '0'), room_type_id, room_status,
            9 + ((i - 1) / 20), '[BULK TEST] Room generated for check-in/check-out testing'
        )
        ON CONFLICT (room_number) DO UPDATE SET
            room_type_id = EXCLUDED.room_type_id,
            room_status = EXCLUDED.room_status,
            floor_number = EXCLUDED.floor_number,
            description = EXCLUDED.description
        RETURNING id INTO room_id;

        -- First 220 rooms get an active booking so every actionable map icon has data.
        IF i <= 220 THEN
            INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status)
            VALUES (
                'Khách Test Active ' || lpad(i::text, 3, '0'),
                'bulk.active.' || lpad(i::text, 3, '0') || '@hms.test',
                '091' || lpad(i::text, 7, '0'), 'CCCD',
                'BULK-A-' || lpad(i::text, 6, '0'), 'Việt Nam', NOW(), 'ACTIVE'
            )
            ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
            RETURNING id INTO customer_id;

            SELECT base_price INTO price FROM room_type WHERE id = room_type_id;
            IF i <= 100 THEN
                booking_status := 'PENDING_CHECK_IN';
                check_in_at := CURRENT_DATE + TIME '14:00';
                check_out_at := CURRENT_DATE + INTERVAL '2 days' + TIME '12:00';
            ELSE
                booking_status := 'CHECKED_IN';
                check_in_at := CURRENT_DATE - INTERVAL '1 day' + TIME '14:00';
                check_out_at := CURRENT_DATE + TIME '11:59';
            END IF;
            total := price * GREATEST(1, (check_out_at::date - check_in_at::date));

            INSERT INTO bookings (
                customer_id, room_id, type_id, price_per_night, quantity,
                check_in_date, check_out_date, booking_status, total_price,
                created_by, created_at, actual_check_in_time, booking_for_other,
                guest_full_name, guest_email, guest_phone, guest_id_type,
                guest_id_number_card, guest_nationality
            ) VALUES (
                customer_id, room_id, room_type_id, price, 1,
                check_in_at, check_out_at, booking_status, total,
                creator_id, NOW() - INTERVAL '2 days',
                CASE WHEN booking_status = 'CHECKED_IN' THEN check_in_at ELSE NULL END,
                FALSE, 'Khách Test Active ' || lpad(i::text, 3, '0'),
                'bulk.active.' || lpad(i::text, 3, '0') || '@hms.test',
                '091' || lpad(i::text, 7, '0'), 'CCCD',
                'BULK-A-' || lpad(i::text, 6, '0'), 'Việt Nam'
            ) RETURNING id INTO booking_id;

            INSERT INTO booking_rooms (booking_id, room_id) VALUES (booking_id, room_id)
            ON CONFLICT DO NOTHING;

            INSERT INTO invoices (
                booking_id, amount, payment_status, payment_method, paid_at,
                payment_confirmed, created_at, updated_at, additional_charges, note
            ) VALUES (
                booking_id, total, 'PAID', 'CASH', NOW() - INTERVAL '1 day',
                TRUE, NOW() - INTERVAL '2 days', NOW(), 0, '[BULK TEST] Paid invoice'
            );
        END IF;
    END LOOP;

    -- 430 extra bookings for pagination/search/history/load testing.
    FOR i IN 221..650 LOOP
        room_type_id := room_type_ids[((i - 1) % array_length(room_type_ids, 1)) + 1];
        SELECT base_price INTO price FROM room_type WHERE id = room_type_id;

        INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, created_at, status)
        VALUES (
            'Khách Test Booking ' || lpad(i::text, 3, '0'),
            'bulk.booking.' || lpad(i::text, 3, '0') || '@hms.test',
            '092' || lpad(i::text, 7, '0'), 'CCCD',
            'BULK-B-' || lpad(i::text, 6, '0'), 'Việt Nam', NOW(), 'ACTIVE'
        )
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id INTO customer_id;

        booking_status := CASE
            WHEN i <= 330 THEN 'PENDING_PAYMENT'
            WHEN i <= 440 THEN 'PENDING_CHECK_IN'
            WHEN i <= 540 THEN 'CHECKED_OUT'
            WHEN i <= 600 THEN 'CANCELLED'
            ELSE 'NO_SHOW'
        END;
        check_in_at := CASE
            WHEN booking_status IN ('CHECKED_OUT', 'CANCELLED', 'NO_SHOW')
                THEN CURRENT_DATE - ((i % 45) + 5) * INTERVAL '1 day' + TIME '14:00'
            ELSE CURRENT_DATE + ((i % 60) + 1) * INTERVAL '1 day' + TIME '14:00'
        END;
        check_out_at := check_in_at + ((i % 5) + 1) * INTERVAL '1 day' - INTERVAL '2 hours';
        total := price * ((i % 5) + 1);

        INSERT INTO bookings (
            customer_id, room_id, type_id, price_per_night, quantity,
            check_in_date, check_out_date, booking_status, total_price,
            created_by, created_at, actual_check_in_time, actual_check_out_time,
            booking_for_other, guest_full_name, guest_email, guest_phone,
            guest_id_type, guest_id_number_card, guest_nationality
        ) VALUES (
            customer_id, NULL, room_type_id, price, 1,
            check_in_at, check_out_at, booking_status, total,
            creator_id, NOW() - (i % 30) * INTERVAL '1 day',
            CASE WHEN booking_status = 'CHECKED_OUT' THEN check_in_at ELSE NULL END,
            CASE WHEN booking_status = 'CHECKED_OUT' THEN check_out_at - INTERVAL '30 minutes' ELSE NULL END,
            FALSE, 'Khách Test Booking ' || lpad(i::text, 3, '0'),
            'bulk.booking.' || lpad(i::text, 3, '0') || '@hms.test',
            '092' || lpad(i::text, 7, '0'), 'CCCD',
            'BULK-B-' || lpad(i::text, 6, '0'), 'Việt Nam'
        ) RETURNING id INTO booking_id;

        INSERT INTO invoices (
            booking_id, amount, payment_status, payment_method, paid_at,
            payment_confirmed, created_at, updated_at, additional_charges, note
        ) VALUES (
            booking_id, total,
            CASE WHEN booking_status = 'PENDING_PAYMENT' THEN 'PENDING'
                 WHEN booking_status = 'CANCELLED' THEN 'CANCELLED' ELSE 'PAID' END,
            CASE WHEN booking_status IN ('PENDING_PAYMENT', 'CANCELLED') THEN NULL ELSE 'TRANSFER' END,
            CASE WHEN booking_status IN ('PENDING_PAYMENT', 'CANCELLED') THEN NULL ELSE NOW() END,
            booking_status NOT IN ('PENDING_PAYMENT', 'CANCELLED'),
            NOW(), NOW(), 0, '[BULK TEST] Generated invoice'
        );
    END LOOP;

    INSERT INTO hms_test_seed_runs(seed_name) VALUES (seed);
    RAISE NOTICE 'Created 300 rooms and 650 bookings/customers with invoices.';
END $$;@@

COMMIT;@@

SELECT 'rooms' AS entity, count(*) AS total FROM room
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'invoices', count(*) FROM invoices;@@
