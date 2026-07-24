# 📚 Hướng dẫn Quản lý Khách hàng & Hóa đơn (Customer & Invoice Guides)

> [!NOTE]
> Tài liệu này đã được tách thành **2 tài liệu độc lập** nhằm mô tả chi tiết quy trình nghiệp vụ, kiến trúc code và bộ câu hỏi bảo vệ đồ án cùng hướng dẫn sửa code live cho Thầy/Cô:

1. 📘 **[CUSTOMER_MANAGEMENT_GUIDE.md](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/CUSTOMER_MANAGEMENT_GUIDE.md)**
   - Nghiệp vụ Quản lý Khách hàng (Khách đăng ký vs. Khách vãng lai).
   - Chi tiết Endpoints, Phân quyền SpEL và Logic kiểm tra trùng lặp.
   - **Bộ câu hỏi Thầy Cô & Hướng dẫn Sửa Code Live**: Thêm trường mới (Số hộ chiếu, Cấp VIP), Xóa mềm vs Xóa vĩnh viễn, Tự sửa Profile cá nhân, Tìm kiếm nâng cao.

2. 🧾 **[INVOICE_BILLING_GUIDE.md](file:///d:/FPT/Ki5/SWP391/Hotel_Management_System/SWP391_Project/INVOICE_BILLING_GUIDE.md)**
   - Mô hình Thanh toán Trả trước 100%, Thanh toán tại Quầy & Thanh toán theo Lô (Batch).
   - Chi tiết VietQR, Webhook và Mô phỏng Thanh toán (Simulate Payment).
   - Custom Security Evaluator (`InvoiceAccessService`).
   - **Bộ câu hỏi Thầy Cô & Hướng dẫn Sửa Code Live**: Bảo mật xem hóa đơn theo User, Thêm Thuế VAT 10% / Phụ phí, Tự động đổi trạng thái Booking `PAID` -> `CONFIRMED`, In / Xuất Hóa đơn PDF.
