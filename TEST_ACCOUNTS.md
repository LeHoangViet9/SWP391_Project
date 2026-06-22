 # Tài khoản test HMS

> Mật khẩu trong database được **BCrypt hash** — không thể xem/giải mã ngược.  
> Chỉ dùng bảng dưới đây (hoặc log khi `bootRun`) để biết mật khẩu gốc.

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@123` | ADMIN |
| `manager` | `Manager@123` | MANAGER |
| `receptionist` | `Reception@123` | RECEPTIONIST |
| `maintenance` | `Maint@123` | MAINTENANCE |
| `housekeeper` | `House@123` | HOUSEKEEPER |
| `customer` | `Customer@123` | CUSTOMER |

**Đăng nhập API:** `POST /api/v1/auth/login`

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Frontend:** http://localhost:5173/login

Tài khoản được tạo tự động lúc khởi động Spring Boot nếu username chưa tồn tại (`UserDataInitializer`).
