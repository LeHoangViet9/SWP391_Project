select * from users
select * from roles;

DROP TABLE IF EXISTS room_state_history;


-- 1. Xóa ràng buộc cũ (nếu nó tồn tại)
ALTER TABLE room DROP CONSTRAINT IF EXISTS room_room_status_check;

-- 2. Thêm lại ràng buộc với đầy đủ các giá trị trong enum RoomStatus
ALTER TABLE room ADD CONSTRAINT room_room_status_check
    CHECK (room_status IN (
                           'AVAILABLE',
                           'OCCUPIED',
                           'DIRTY',
                           'MAINTENANCE',
                           'INACTIVE',
                           'RESERVED',
                           'CLEANING',
                           'READY',
                           'OUT_OF_ORDER'
        ));


SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'room_room_status_check';

-- Hãy đảm bảo dữ liệu từ current_state đã được chuyển sang hoặc không cần thiết nữa