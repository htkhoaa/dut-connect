# Kiểm tra danh mục DUT và giao diện

Ngày kiểm tra: 15/10/2026. Không bổ sung bộ kiểm thử tự động.

## Kết quả

- Backend Java 21: `mvnw.cmd clean package -DskipTests` thành công.
- Frontend: `npm.cmd run build` thành công.
- `docker compose config --quiet` hợp lệ; `docker compose up -d --build` thành công, PostgreSQL/backend/frontend đều healthy.
- PostgreSQL 16 mới, profile prod: Flyway V1–V20 chạy thành công; Hibernate validate thành công; 28 bảng nghiệp vụ.
- Bootstrap tạo duy nhất tài khoản ADMIN kiểm tra trong database cô lập. Import dùng ADMIN này, không tạo tài khoản đại diện giả.
- Import tạo 5 tổ chức VERIFIED, 8 đề xuất APPROVED và 8 chiến dịch: OPEN 2, ACTIVE 2, COMPLETED 2, CANCELLED 1, DRAFT 1. Mỗi chiến dịch có đề xuất và OWNER đúng quy trình.
- Public API trả 5 tổ chức và 7 chiến dịch; DRAFT không được công khai. Các bộ lọc OPEN/ACTIVE/COMPLETED/CANCELLED trả dữ liệu tương ứng.
- Khởi động lại database mới vẫn có 13 khóa import; log ghi `organizations=0 campaigns=0`. Lịch không bị dịch chuyển sau mỗi lần restart.
- Database kiểm tra có 0 donation PAID; không nhập khoản thu, người tham gia hay giờ công giả.
- DBML phân tích thành công bằng `@dbml/core`, parser `dbmlv2`; đã bổ sung bảng và hai FK của V20.
- Chrome: rộng 320/390/768/1024/1440px không tràn ngang. Tâm nav desktop 719.992px, tâm trang 720px. Card hoạt động có nền trắng, bo góc 24px, viền xanh và bóng; không còn hòa vào ảnh nền.
- Ảnh card tải thành công; không có ảnh hỏng trong trang chiến dịch khi kiểm tra. VI/EN và bố cục điện thoại được giữ nguyên.

## Dữ liệu và nguồn

Nguồn sự kiện được ghi trong từng hồ sơ, không lấy tên đơn vị từ tên đường dẫn khoa vì website DUT có đăng chéo bài.

- Đoàn trường, Mùa hè xanh: https://dut.udn.vn/KhoaHoa/Tintuc/id/11414
- Hội Sinh viên, Đoàn trường, Đội Tư vấn sinh viên, Xuân tình nguyện: https://dut.udn.vn/Fast/Tintuc/id/11702
- CLB Sức trẻ Khoa Công nghệ Nhiệt – Điện lạnh, Chủ nhật xanh: https://dut.udn.vn/KhoaNhietDL/Tintuc/id/11881
- Liên Chi đoàn Khoa Quản lý Dự án: https://fpm.dut.udn.vn/tin-tuc/chi-tiet/FPM---Chu-nhat-xanh-1867
- Ngày hội hiến máu: https://dut.udn.vn/hoidongtruong/Tintuc/id/6213

Ngày, chỉ tiêu và trạng thái của danh mục vận hành là mô phỏng theo yêu cầu, khác thời gian/số liệu gốc. OPEN có hạn tuyển 120 ngày sau lần import đầu; ACTIVE còn 180–200 ngày. Hai biến thể Chủ nhật xanh và kế hoạch hiến máu là kịch bản trải nghiệm dựa trên nguồn, không phải sự kiện lịch sử bổ sung. CANCELLED không khẳng định chương trình gốc đã bị hủy.

Không tiếp quản tổ chức trùng tên thuộc người dùng khác. Không sửa các bản ghi đã import trong các lần khởi động tiếp theo. Bộ import có transaction, advisory lock và khóa duy nhất chống trùng. Nếu chưa có ADMIN đang ACTIVE, import hoãn đến lần khởi động sau khi có ADMIN. Đặt `APP_DUT_CATALOGUE_ENABLED=false` để tắt import mới.
