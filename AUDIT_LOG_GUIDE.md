# Audit Log cho Hotel Management System

## 1. Mục đích

Audit Log dùng để ghi lại các thao tác quan trọng trong hệ thống khách sạn: ai thực hiện, làm gì, tác động lên tài nguyên nào, trước/sau thay đổi ra sao, thời điểm nào, từ IP/request nào và thao tác thành công hay thất bại. Đây là lớp bằng chứng phục vụ kiểm tra nội bộ, điều tra sự cố, truy vết bảo mật và đối soát nghiệp vụ.

## 2. JSON mẫu

```json
{
  "actor": {
    "user_id": 12,
    "username": "Nguyen Van A",
    "role": "MANAGER",
    "email": "ng***@gmail.com"
  },
  "action": "UPDATE_ROOM_STATUS",
  "module": "ROOM",
  "target_resource": {
    "resource_type": "ROOM",
    "resource_id": "305",
    "resource_name": "305"
  },
  "changes": {
    "before": {
      "roomStatus": "AVAILABLE"
    },
    "after": {
      "roomStatus": "MAINTENANCE"
    }
  },
  "timestamp": "2026-06-26T15:00:00Z",
  "ip_address": "192.168.1.10",
  "user_agent": "Mozilla/5.0",
  "status": "SUCCESS",
  "error_message": null,
  "request_id": "7b36b8a9-daa0-44dc-b0e5-7b5b9c9fcb0b",
  "previous_hash": "previous-row-sha256",
  "row_hash": "current-row-sha256"
}
```

## 3. Bảng PostgreSQL

Bảng chính: `audit_logs`.

Các cột quan trọng:

- `actor_user_id`, `actor_username`, `actor_role`, `actor_email`: người thực hiện.
- `action`, `module`, `resource_type`, `resource_id`, `resource_name`: thao tác và tài nguyên bị tác động.
- `changes JSONB`: lưu `before` và `after`.
- `ip_address`, `user_agent`, `request_id`: truy vết request.
- `status`, `error_message`: kết quả thao tác.
- `previous_hash`, `row_hash`: hash chain để phát hiện sửa log.
- `created_at TIMESTAMPTZ`: thời gian UTC.

Index nên có:

- `created_at DESC`
- `actor_user_id`
- `action`
- `module`
- `(resource_type, resource_id)`
- `status`
- `request_id`
- `GIN(changes)` nếu cần tìm trong JSONB.

Khi dữ liệu lớn: partition theo tháng trên `created_at`, archive log cũ sang storage/SIEM, chỉ giữ log nóng trong PostgreSQL 6-12 tháng tùy chính sách.

## 4. Code đã triển khai

Backend:

- Entity: `com.hms.entity.audit.AuditLog`
- DTO: `AuditLogRequest`, `AuditLogResponse`
- Repository: `AuditLogRepository`
- Service: `AuditLogService`, `AuditLogServiceImpl`
- Controller: `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/{id}`
- Masking: `SensitiveDataMasker`
- Request trace: `RequestIdFilter`
- AOP demo: `@Auditable(action = "...", module = "...")`, `AuditAspect`

Frontend:

- Service: `frontend/src/services/auditLogService.js`
- UI: `frontend/src/components/AuditLogManager.jsx`
- Menu permission: `AUDIT_LOG_VIEW`

## 5. Tích hợp vào service hiện có

Nên ghi thủ công trong service khi cần `before/after` chính xác, ví dụ:

```java
Map<String, Object> before = roomAuditSnapshot(room);
room.setRoomStatus(status);
Room updated = roomRepository.save(room);

auditLogService.logSuccess(
    "UPDATE_ROOM_STATUS",
    "ROOM",
    "ROOM",
    updated.getId(),
    updated.getRoomNumber(),
    auditLogService.changes(before, roomAuditSnapshot(updated))
);
```

Dùng AOP khi thao tác đơn giản, không cần custom nhiều dữ liệu:

```java
@Auditable(action = "EXPORT_AUDIT_LOG", module = "REPORT", resourceType = "AUDIT_LOG")
public byte[] exportAuditLogs() {
    ...
}
```

Ghi thủ công phù hợp cho booking, thanh toán, đổi trạng thái phòng, phân quyền. AOP phù hợp cho view/export/report hoặc các thao tác ít cần snapshot nghiệp vụ.

## 6. Chính sách bảo mật

- Người dùng thường không được xem/sửa/xóa audit log.
- Chỉ role có `AUDIT_LOG_VIEW`, hiện gán cho `ADMIN` và `MANAGER`, được xem log.
- Không có API update/delete audit log.
- SQL mẫu có trigger chặn `UPDATE` và `DELETE` trên `audit_logs`.
- Ghi log theo cơ chế append-only.
- Dùng `previous_hash` và `row_hash` để kiểm tra toàn vẹn.
- Không ghi password, token, OTP, API secret.
- Mask PII trước khi lưu:
  - Email: `ng***@gmail.com`
  - Phone: `******1234`
  - CCCD/hộ chiếu: `********9012`
  - Card: `**** **** **** 1234`
- Backup định kỳ và có thể đẩy log quan trọng sang SIEM/cloud storage.

## 7. Action verbs đề xuất

User & Role:

- `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`, `LOCK_USER`, `UNLOCK_USER`
- `UPDATE_ROLE`, `UPDATE_USER_PERMISSIONS`
- `CHANGE_PASSWORD`, `RESET_PASSWORD`
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`

Room:

- `CREATE_ROOM`, `UPDATE_ROOM`, `DELETE_ROOM`, `UPDATE_ROOM_STATUS`
- `MARK_ROOM_AVAILABLE`, `MARK_ROOM_OCCUPIED`, `MARK_ROOM_MAINTENANCE`, `MARK_ROOM_CLEANING`

Booking:

- `CREATE_BOOKING`, `UPDATE_BOOKING`, `CANCEL_BOOKING`, `CONFIRM_BOOKING`
- `CHECK_IN`, `CHECK_OUT`, `CHANGE_BOOKING_DATE`, `CHANGE_BOOKING_ROOM`, `APPLY_DISCOUNT`

Customer:

- `CREATE_CUSTOMER`, `UPDATE_CUSTOMER`, `DELETE_CUSTOMER`
- `VIEW_CUSTOMER_DETAIL`, `UPDATE_CUSTOMER_IDENTITY`

Billing & Payment:

- `CREATE_INVOICE`, `UPDATE_INVOICE`, `DELETE_INVOICE`
- `ADD_PAYMENT`, `REFUND_PAYMENT`, `CANCEL_PAYMENT`, `UPDATE_PAYMENT_STATUS`, `PRINT_INVOICE`

Housekeeping:

- `CREATE_HOUSEKEEPING_TASK`, `ASSIGN_HOUSEKEEPING_TASK`
- `UPDATE_HOUSEKEEPING_STATUS`, `COMPLETE_HOUSEKEEPING_TASK`, `CANCEL_HOUSEKEEPING_TASK`
- `REPORT_ROOM_CLEANED`

Maintenance:

- `CREATE_MAINTENANCE_REQUEST`, `ASSIGN_MAINTENANCE_TASK`
- `UPDATE_MAINTENANCE_STATUS`, `COMPLETE_MAINTENANCE_TASK`, `CANCEL_MAINTENANCE_TASK`
- `REPORT_EQUIPMENT_BROKEN`

Inventory / Equipment:

- `CREATE_EQUIPMENT`, `UPDATE_EQUIPMENT`, `DELETE_EQUIPMENT`
- `IMPORT_SUPPLY`, `EXPORT_SUPPLY`, `REQUEST_SUPPLY`
- `APPROVE_SUPPLY_REQUEST`, `REJECT_SUPPLY_REQUEST`

Report:

- `VIEW_REVENUE_REPORT`, `EXPORT_REVENUE_REPORT`
- `VIEW_OCCUPANCY_REPORT`, `EXPORT_AUDIT_LOG`

## 8. Best practices

- Chỉ log dữ liệu cần thiết, tránh log toàn bộ entity lớn.
- Log failure cho login, payment, phân quyền, xóa dữ liệu.
- Dùng UTC cho `created_at`.
- Gắn `request_id` vào response để debug nhanh.
- Tách quyền xem audit log khỏi quyền quản trị hệ thống.
- Định kỳ kiểm tra hash chain để phát hiện log bị chỉnh sửa ngoài luồng.
