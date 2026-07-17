
DO $$
DECLARE
    v_admin_id BIGINT;
    v_housekeeper_id BIGINT;
    v_room_type_id BIGINT;
    
    -- IDs for each room
    v_room_id_901 BIGINT;
    v_room_id_902 BIGINT;
    v_room_id_903 BIGINT;
    v_room_id_904 BIGINT;
    v_room_id_905 BIGINT;
    
    -- IDs for each customer
    v_cust_id_901 BIGINT;
    v_cust_id_902 BIGINT;
    v_cust_id_903 BIGINT;
    v_cust_id_904 BIGINT;
    v_cust_id_905 BIGINT;
    
    -- Booking IDs
    v_book_id_901 BIGINT;
    v_book_id_902 BIGINT;
    v_book_id_903 BIGINT;
    v_book_id_904 BIGINT;
    v_book_id_905 BIGINT;
    
    -- Task IDs
    v_task_id_901 BIGINT;
    v_task_id_902 BIGINT;
    v_task_id_903 BIGINT;
    v_task_id_904 BIGINT;
    v_task_id_905 BIGINT;
BEGIN
    -- 1. Lấy thông tin admin và housekeeper test
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@test.hms';
    SELECT id INTO v_housekeeper_id FROM users WHERE email = 'housekeeper@test.hms';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Missing admin@test.hms. Hãy khởi động backend trước để tạo tài khoản test mặc định.';
    END IF;

    IF v_housekeeper_id IS NULL THEN
        RAISE EXCEPTION 'Missing housekeeper@test.hms. Hãy khởi động backend trước để tạo tài khoản test mặc định.';
    END IF;

    -- 2. Tạo loại phòng test HMS_TEST_HK_TYPE
    INSERT INTO room_type (type_name, description, base_price, max_guests, status)
    VALUES ('HMS_TEST_HK_TYPE', 'Loại phòng test phục vụ kiểm thử Housekeeping', 950000, 2, 'ACTIVE')
    ON CONFLICT (type_name) DO UPDATE
    SET description = EXCLUDED.description,
        base_price = EXCLUDED.base_price,
        max_guests = EXCLUDED.max_guests,
        status = EXCLUDED.status
    RETURNING id INTO v_room_type_id;

    IF v_room_type_id IS NULL THEN
        SELECT id INTO v_room_type_id FROM room_type WHERE type_name = 'HMS_TEST_HK_TYPE';
    END IF;

    -- 3. Tạo các phòng test từ HK-901 đến HK-905
    -- HK-901: DIRTY (chờ dọn)
    INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
    VALUES ('HK-901', v_room_type_id, 'DIRTY', 9, 'Phòng test HK-901 vừa checkout - Trạng thái DIRTY')
    ON CONFLICT (room_number) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, room_status = 'DIRTY', description = EXCLUDED.description
    RETURNING id INTO v_room_id_901;
    IF v_room_id_901 IS NULL THEN SELECT id INTO v_room_id_901 FROM room WHERE room_number = 'HK-901'; END IF;

    -- HK-902: DIRTY (chờ dọn)
    INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
    VALUES ('HK-902', v_room_type_id, 'DIRTY', 9, 'Phòng test HK-902 vừa checkout - Trạng thái DIRTY')
    ON CONFLICT (room_number) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, room_status = 'DIRTY', description = EXCLUDED.description
    RETURNING id INTO v_room_id_902;
    IF v_room_id_902 IS NULL THEN SELECT id INTO v_room_id_902 FROM room WHERE room_number = 'HK-902'; END IF;

    -- HK-903: CLEANING (đang dọn)
    INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
    VALUES ('HK-903', v_room_type_id, 'CLEANING', 9, 'Phòng test HK-903 đang được dọn dẹp - Trạng thái CLEANING')
    ON CONFLICT (room_number) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, room_status = 'CLEANING', description = EXCLUDED.description
    RETURNING id INTO v_room_id_903;
    IF v_room_id_903 IS NULL THEN SELECT id INTO v_room_id_903 FROM room WHERE room_number = 'HK-903'; END IF;

    -- HK-904: DIRTY (chờ dọn)
    INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
    VALUES ('HK-904', v_room_type_id, 'DIRTY', 9, 'Phòng test HK-904 vừa checkout - Trạng thái DIRTY')
    ON CONFLICT (room_number) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, room_status = 'DIRTY', description = EXCLUDED.description
    RETURNING id INTO v_room_id_904;
    IF v_room_id_904 IS NULL THEN SELECT id INTO v_room_id_904 FROM room WHERE room_number = 'HK-904'; END IF;

    -- HK-905: READY (đã dọn xong)
    INSERT INTO room (room_number, room_type_id, room_status, floor_number, description)
    VALUES ('HK-905', v_room_type_id, 'READY', 9, 'Phòng test HK-905 đã dọn xong - Trạng thái READY')
    ON CONFLICT (room_number) DO UPDATE SET room_type_id = EXCLUDED.room_type_id, room_status = 'READY', description = EXCLUDED.description
    RETURNING id INTO v_room_id_905;
    IF v_room_id_905 IS NULL THEN SELECT id INTO v_room_id_905 FROM room WHERE room_number = 'HK-905'; END IF;

    -- 4. Tạo các khách hàng tương ứng để liên kết booking
    -- Khách 901
    INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, status, created_at)
    VALUES ('Khách Hàng HK901', 'hk901.guest@test.hms', '0901000901', 'CCCD', 'HK901CCCD', 'Vietnam', 'ACTIVE', NOW())
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING id INTO v_cust_id_901;
    IF v_cust_id_901 IS NULL THEN SELECT id INTO v_cust_id_901 FROM customers WHERE email = 'hk901.guest@test.hms'; END IF;

    -- Khách 902
    INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, status, created_at)
    VALUES ('Khách Hàng HK902', 'hk902.guest@test.hms', '0901000902', 'CCCD', 'HK902CCCD', 'Vietnam', 'ACTIVE', NOW())
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING id INTO v_cust_id_902;
    IF v_cust_id_902 IS NULL THEN SELECT id INTO v_cust_id_902 FROM customers WHERE email = 'hk902.guest@test.hms'; END IF;

    -- Khách 903
    INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, status, created_at)
    VALUES ('Khách Hàng HK903', 'hk903.guest@test.hms', '0901000903', 'CCCD', 'HK903CCCD', 'Vietnam', 'ACTIVE', NOW())
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING id INTO v_cust_id_903;
    IF v_cust_id_903 IS NULL THEN SELECT id INTO v_cust_id_903 FROM customers WHERE email = 'hk903.guest@test.hms'; END IF;

    -- Khách 904
    INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, status, created_at)
    VALUES ('Khách Hàng HK904', 'hk904.guest@test.hms', '0901000904', 'CCCD', 'HK904CCCD', 'Vietnam', 'ACTIVE', NOW())
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING id INTO v_cust_id_904;
    IF v_cust_id_904 IS NULL THEN SELECT id INTO v_cust_id_904 FROM customers WHERE email = 'hk904.guest@test.hms'; END IF;

    -- Khách 905
    INSERT INTO customers (full_name, email, phone, id_type, id_number_card, nationality, status, created_at)
    VALUES ('Khách Hàng HK905', 'hk905.guest@test.hms', '0901000905', 'CCCD', 'HK905CCCD', 'Vietnam', 'ACTIVE', NOW())
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone RETURNING id INTO v_cust_id_905;
    IF v_cust_id_905 IS NULL THEN SELECT id INTO v_cust_id_905 FROM customers WHERE email = 'hk905.guest@test.hms'; END IF;

    -- 5. Tạo các booking CHECKED_OUT tương ứng
    -- Booking 901
    SELECT id INTO v_book_id_901 FROM bookings WHERE room_id = v_room_id_901 AND booking_status = 'CHECKED_OUT' ORDER BY id DESC LIMIT 1;
    IF v_book_id_901 IS NULL THEN
        INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at, actual_check_in_time, booking_for_other, guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality)
        VALUES (v_cust_id_901, v_room_id_901, v_room_type_id, 950000, 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '40 minutes', 'CHECKED_OUT', 1900000, v_admin_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', false, 'Khách Hàng HK901', 'hk901.guest@test.hms', '0901000901', 'CCCD', 'HK901CCCD', 'Vietnam')
        RETURNING id INTO v_book_id_901;
    END IF;

    -- Booking 902
    SELECT id INTO v_book_id_902 FROM bookings WHERE room_id = v_room_id_902 AND booking_status = 'CHECKED_OUT' ORDER BY id DESC LIMIT 1;
    IF v_book_id_902 IS NULL THEN
        INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at, actual_check_in_time, booking_for_other, guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality)
        VALUES (v_cust_id_902, v_room_id_902, v_room_type_id, 950000, 1, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 hours', 'CHECKED_OUT', 950000, v_admin_id, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days', false, 'Khách Hàng HK902', 'hk902.guest@test.hms', '0901000902', 'CCCD', 'HK902CCCD', 'Vietnam')
        RETURNING id INTO v_book_id_902;
    END IF;

    -- Booking 903
    SELECT id INTO v_book_id_903 FROM bookings WHERE room_id = v_room_id_903 AND booking_status = 'CHECKED_OUT' ORDER BY id DESC LIMIT 1;
    IF v_book_id_903 IS NULL THEN
        INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at, actual_check_in_time, booking_for_other, guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality)
        VALUES (v_cust_id_903, v_room_id_903, v_room_type_id, 950000, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours', 'CHECKED_OUT', 2850000, v_admin_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', false, 'Khách Hàng HK903', 'hk903.guest@test.hms', '0901000903', 'CCCD', 'HK903CCCD', 'Vietnam')
        RETURNING id INTO v_book_id_903;
    END IF;

    -- Booking 904
    SELECT id INTO v_book_id_904 FROM bookings WHERE room_id = v_room_id_904 AND booking_status = 'CHECKED_OUT' ORDER BY id DESC LIMIT 1;
    IF v_book_id_904 IS NULL THEN
        INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at, actual_check_in_time, booking_for_other, guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality)
        VALUES (v_cust_id_904, v_room_id_904, v_room_type_id, 950000, 1, NOW() - INTERVAL '1 days', NOW() - INTERVAL '15 minutes', 'CHECKED_OUT', 950000, v_admin_id, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days', false, 'Khách Hàng HK904', 'hk904.guest@test.hms', '0901000904', 'CCCD', 'HK904CCCD', 'Vietnam')
        RETURNING id INTO v_book_id_904;
    END IF;

    -- Booking 905
    SELECT id INTO v_book_id_905 FROM bookings WHERE room_id = v_room_id_905 AND booking_status = 'CHECKED_OUT' ORDER BY id DESC LIMIT 1;
    IF v_book_id_905 IS NULL THEN
        INSERT INTO bookings (customer_id, room_id, type_id, price_per_night, quantity, check_in_date, check_out_date, booking_status, total_price, created_by, created_at, actual_check_in_time, booking_for_other, guest_full_name, guest_email, guest_phone, guest_id_type, guest_id_number_card, guest_nationality)
        VALUES (v_cust_id_905, v_room_id_905, v_room_type_id, 950000, 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 hours', 'CHECKED_OUT', 1900000, v_admin_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', false, 'Khách Hàng HK905', 'hk905.guest@test.hms', '0901000905', 'CCCD', 'HK905CCCD', 'Vietnam')
        RETURNING id INTO v_book_id_905;
    END IF;

    -- 6. Tạo lịch sử thay đổi trạng thái sang DIRTY do checkout
    -- HK-901
    IF NOT EXISTS (SELECT 1 FROM room_state_history WHERE room_id = v_room_id_901 AND previous_state = 'OCCUPIED' AND current_state = 'DIRTY') THEN
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason)
        VALUES (v_room_id_901, 'OCCUPIED', 'DIRTY', 'TASK_CANCELLATION', v_admin_id, NOW() - INTERVAL '40 minutes', 'Checkout booking #' || v_book_id_901);
    END IF;

    -- HK-902
    IF NOT EXISTS (SELECT 1 FROM room_state_history WHERE room_id = v_room_id_902 AND previous_state = 'OCCUPIED' AND current_state = 'DIRTY') THEN
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason)
        VALUES (v_room_id_902, 'OCCUPIED', 'DIRTY', 'TASK_CANCELLATION', v_admin_id, NOW() - INTERVAL '1 hours', 'Checkout booking #' || v_book_id_902);
    END IF;

    -- HK-903
    IF NOT EXISTS (SELECT 1 FROM room_state_history WHERE room_id = v_room_id_903 AND previous_state = 'OCCUPIED' AND current_state = 'DIRTY') THEN
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason)
        VALUES (v_room_id_903, 'OCCUPIED', 'DIRTY', 'TASK_CANCELLATION', v_admin_id, NOW() - INTERVAL '2 hours', 'Checkout booking #' || v_book_id_903);
    END IF;

    -- HK-904
    IF NOT EXISTS (SELECT 1 FROM room_state_history WHERE room_id = v_room_id_904 AND previous_state = 'OCCUPIED' AND current_state = 'DIRTY') THEN
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason)
        VALUES (v_room_id_904, 'OCCUPIED', 'DIRTY', 'TASK_CANCELLATION', v_admin_id, NOW() - INTERVAL '15 minutes', 'Checkout booking #' || v_book_id_904);
    END IF;

    -- HK-905
    IF NOT EXISTS (SELECT 1 FROM room_state_history WHERE room_id = v_room_id_905 AND previous_state = 'OCCUPIED' AND current_state = 'DIRTY') THEN
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason)
        VALUES (v_room_id_905, 'OCCUPIED', 'DIRTY', 'TASK_CANCELLATION', v_admin_id, NOW() - INTERVAL '3 hours', 'Checkout booking #' || v_book_id_905);
    END IF;

    -- 7. Tạo / Cập nhật Housekeeping tasks
    -- Task HK-901: PENDING
    SELECT id INTO v_task_id_901 FROM housekeeping_task WHERE room_id = v_room_id_901 AND task_status = 'PENDING' ORDER BY id DESC LIMIT 1;
    IF v_task_id_901 IS NULL THEN
        INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at)
        VALUES (v_room_id_901, v_housekeeper_id, v_admin_id, 'PENDING', 'Dọn phòng HK-901: Khách đã checkout, cần thay ga giường và bổ sung khăn tắm.', NULL, NULL, NOW(), NOW())
        RETURNING id INTO v_task_id_901;
    END IF;

    -- Task HK-902: PENDING
    SELECT id INTO v_task_id_902 FROM housekeeping_task WHERE room_id = v_room_id_902 AND task_status = 'PENDING' ORDER BY id DESC LIMIT 1;
    IF v_task_id_902 IS NULL THEN
        INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at)
        VALUES (v_room_id_902, v_housekeeper_id, v_admin_id, 'PENDING', 'Dọn phòng HK-902: Khách hàng checkout sớm, lau dọn khu vực nhà tắm kỹ.', NULL, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
        RETURNING id INTO v_task_id_902;
    END IF;

    -- Task HK-903: IN_PROGRESS (Phòng CLEANING)
    SELECT id INTO v_task_id_903 FROM housekeeping_task WHERE room_id = v_room_id_903 AND task_status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1;
    IF v_task_id_903 IS NULL THEN
        INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at)
        VALUES (v_room_id_903, v_housekeeper_id, v_admin_id, 'IN_PROGRESS', 'Đang dọn phòng HK-903: Bắt đầu dọn dẹp từ 15 phút trước.', NOW() - INTERVAL '15 minutes', NULL, NOW() - INTERVAL '1 hours', NOW() - INTERVAL '15 minutes')
        RETURNING id INTO v_task_id_903;
        
        -- Ghi nhận lịch sử chuyển sang CLEANING
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason, task_id)
        VALUES (v_room_id_903, 'DIRTY', 'CLEANING', 'TASK_CLEANING', v_housekeeper_id, NOW() - INTERVAL '15 minutes', 'Bắt đầu dọn phòng HK-903', v_task_id_903);
    END IF;

    -- Task HK-904: PENDING
    SELECT id INTO v_task_id_904 FROM housekeeping_task WHERE room_id = v_room_id_904 AND task_status = 'PENDING' ORDER BY id DESC LIMIT 1;
    IF v_task_id_904 IS NULL THEN
        INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at)
        VALUES (v_room_id_904, v_housekeeper_id, v_admin_id, 'PENDING', 'Dọn phòng HK-904: Vệ sinh ban công và lau bụi các cửa kính.', NULL, NULL, NOW(), NOW())
        RETURNING id INTO v_task_id_904;
    END IF;

    -- Task HK-905: COMPLETED (Phòng READY)
    SELECT id INTO v_task_id_905 FROM housekeeping_task WHERE room_id = v_room_id_905 AND task_status = 'COMPLETED' ORDER BY id DESC LIMIT 1;
    IF v_task_id_905 IS NULL THEN
        INSERT INTO housekeeping_task (room_id, assigned_to, assigned_by, task_status, notes, started_at, completed_at, created_at, updated_at)
        VALUES (v_room_id_905, v_housekeeper_id, v_admin_id, 'COMPLETED', 'Đã hoàn tất dọn phòng HK-905 sạch sẽ thơm tho.', NOW() - INTERVAL '1 hours', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '10 minutes')
        RETURNING id INTO v_task_id_905;
        
        -- Ghi nhận lịch sử chuyển sang CLEANING rồi READY
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason, task_id)
        VALUES (v_room_id_905, 'DIRTY', 'CLEANING', 'TASK_CLEANING', v_housekeeper_id, NOW() - INTERVAL '1 hours', 'Bắt đầu dọn phòng HK-905', v_task_id_905);
        INSERT INTO room_state_history (room_id, previous_state, current_state, triggered_by_process, triggered_by_user, changed_at, reason, task_id)
        VALUES (v_room_id_905, 'CLEANING', 'READY', 'TASK_COMPLETION', v_housekeeper_id, NOW() - INTERVAL '10 minutes', 'Hoàn thành dọn phòng HK-905', v_task_id_905);
    END IF;

    RAISE NOTICE 'Seed dữ liệu test thành công:';
    RAISE NOTICE ' - HK-901: DIRTY, task PENDING (id: %)', v_task_id_901;
    RAISE NOTICE ' - HK-902: DIRTY, task PENDING (id: %)', v_task_id_902;
    RAISE NOTICE ' - HK-903: CLEANING, task IN_PROGRESS (id: %)', v_task_id_903;
    RAISE NOTICE ' - HK-904: DIRTY, task PENDING (id: %)', v_task_id_904;
    RAISE NOTICE ' - HK-905: READY, task COMPLETED (id: %)', v_task_id_905;
    RAISE NOTICE 'Tất cả task đều gán cho nhân viên: housekeeper@test.hms';
END $$;
