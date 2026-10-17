# Kết quả kiểm tra bản giữa kỳ

Ngày: 17/10/2026. Nhánh làm việc: `midterm/19-tables`. Điểm lưu bản đầy đủ: `archive/full-28-tables`, commit `9a1bd5a`.

- Backend `mvnw.cmd clean package -DskipTests`: BUILD SUCCESS, Java 21/Spring Boot 3.4.3.
- Frontend `npm.cmd run build`: thành công.
- Khởi tạo Flyway mới và Hibernate validate: thành công, 19 bảng ứng dụng, 33 FK.
- DBML được xuất từ metadata database và parse bằng `@dbml/core` với `dbmlv2`.
- 54 lượt HTTP kiểm tra luồng chính đạt: tài khoản, hồ sơ/kỹ năng, tổ chức/thành viên, đề xuất/duyệt, kỹ năng/quản lý chiến dịch, tuyển người, họp, điểm danh, dashboard, Excel, quyền, refresh/logout và route bị hoãn trả 404.
- 26 lượt kiểm tra bổ sung đạt: edition đếm 19 bảng thực tế, avatar JPEG, đình chỉ/khôi phục tổ chức/tài khoản, chuyển chủ sở hữu, quản trị danh mục, hủy đăng ký, chặn kế hoạch tài chính và trạng thái chiến dịch cuối.
- Kiểm tra nâng cấp từ fixture bản đầy đủ: sao chép được 4 tài khoản, chiến dịch liên quan, 1 lịch họp và 1 bản ghi điểm danh. Fingerprint cả 28 bảng nguồn giống trước/sau. Seed sau nâng cấp ghi organizations=0 campaigns=0, không tạo trùng hoặc dịch lịch.
- Edge headless với profile riêng: ảnh tải được, không có ảnh hỏng trong trang chủ kiểm tra; không có link tới tasks/finance/donations/completions/history trong không gian quản lý; form đề xuất có 1 hình thức đóng góp và không có trường tài chính.
- Responsive 320/390/768/1440px không tràn ngang; đổi VI/EN thành công; không ghi nhận lỗi JavaScript trong lượt kiểm tra.
- AI: kiểm tra availability=false; chưa gọi dịch vụ AI thật vì không có API key trong cấu hình kiểm tra.

Máy kiểm tra hiện có PostgreSQL 18 và không có Docker CLI. Vì vậy các lượt chạy local dùng PostgreSQL 18 trong cluster cô lập, không phải Docker/PostgreSQL 16. Compose vẫn khai báo PostgreSQL 16 và Dockerfile giữ Java 21/Node 22; không ghi nhận một lượt Docker Compose runtime thành công trên máy này. Kết quả build/deploy Docker backend trên Render được xác minh riêng khi phát hành. Không chạy kiểm tra ghi dữ liệu vào production.
