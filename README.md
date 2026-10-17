# DUT Connect — Bản giữa kỳ

Nền tảng tổ chức chiến dịch tình nguyện dành cho sinh viên Đại học Bách khoa — Đại học Đà Nẵng. Bản này có **19 bảng ứng dụng**, giữ UI hiện đại và luồng tổ chức → đề xuất → tuyển người → lịch họp → điểm danh.

- Website: https://dutconnect.vercel.app
- Backend: https://dut-connect.onrender.com
- Nhánh giữa kỳ: midterm/19-tables.
- [Bản đầy đủ 28 bảng được bảo toàn](https://github.com/htkhoaa/dut-connect/tree/archive/full-28-tables).
- [Đặc tả hiện hành](spec.md) · [Báo cáo chức năng và giải thích 19 bảng](docs/midterm-report.md) · [DBML cho dbdiagram](docs/dut-connect.dbml) · [Checklist thủ công](docs/manual-smoke-checklist.md).

## Công nghệ

Java 21, Spring Boot 3.4.3, Maven; PostgreSQL 16, Flyway. React/TypeScript/Vite/Tailwind, Node.js 22.12+, npm. Backend modular monolith, controller → application/domain → repository port/infrastructure. Không có bộ kiểm thử tự động trong phạm vi PBL này.

## Chạy local bằng Docker

1. Sao chép .env.example thành .env; tạo APP_JWT_SECRET ngẫu nhiên tối thiểu 32 byte.
2. Lần đầu, bật APP_BOOTSTRAP_ADMIN_ENABLED=true và đặt thông tin ADMIN/mật khẩu riêng. Không đưa .env lên Git. Production mặc định tắt bootstrap nếu chưa cấu hình.
3. Chạy docker compose up -d --build. Mở http://localhost (port 80).
4. ADMIN có sẵn thì không tạo lại. Seed 5 tổ chức/8 chiến dịch chỉ chạy khi có ADMIN active; lịch mô phỏng có nhãn, không có tài khoản/tiền/giờ công giả. APP_DUT_CATALOGUE_ENABLED=false tắt các lần seed mới mà không xóa dữ liệu.

Chạy host: mở port loopback qua docker-compose.dev.yml hoặc dùng PostgreSQL riêng; cấu hình SPRING_DATASOURCE_URL/USERNAME/PASSWORD, APP_JWT_SECRET và SERVER_PORT. Frontend dùng npm ci, npm run dev; VITE_BACKEND_PROXY_TARGET trỏ về backend (mặc định http://localhost:8081).

Build backend: cd backend và ./mvnw clean package -DskipTests (Windows: mvnw.cmd). Build frontend: cd frontend, npm ci, npm run build.

## Database và chuyển phiên bản

Ứng dụng chỉ dùng schema **dut_connect_midterm**, gồm 19 bảng nghiệp vụ và bảng metadata Flyway. V1 tạo schema giữa kỳ; V2 sao chép các bảng còn dùng từ schema dut_connect nếu có. Không xóa/sửa schema bản đầy đủ. Đề xuất/chiến dịch có quyên góp không chuyển sang phiên bản chỉ tình nguyện; dữ liệu nguồn vẫn được giữ. Tài khoản/mật khẩu được sao chép; refresh token không sao chép nên cần đăng nhập lại.

Khóa seed_key trên organizations/campaigns thay bảng theo dõi import riêng. Lịch OPEN còn 120 ngày tuyển, ACTIVE còn 180–200 ngày tính từ lần seed đầu; restart không đổi lịch và không ghi đè bản ghi đã seed. Ảnh thật và các nguồn DUT nằm trong frontend/public/images/README.md và từng hồ sơ hoạt động.

## Deploy và rollback

Vercel dùng root frontend; Render dùng backend/Dockerfile. Nhánh main là nhánh phát hành của hai dịch vụ; source được phát triển trên midterm/19-tables rồi đẩy commit đã kiểm tra tới main. Vercel proxy /api sang Render để refresh cookie cùng origin. Production dùng profile prod và APP_ALLOWED_ORIGINS=https://dutconnect.vercel.app; cấu hình JWT/database bằng Environment, không sửa YAML bằng bí mật.

Render tự tạo schema giữa kỳ trên database hiện có nếu tài khoản DB có quyền tạo schema và đọc schema cũ. Không cần xóa database Neon. Có thể kiểm tra edition và số bảng thực tế bằng /api/v1/system/edition. Render Free có thể cần thời gian đánh thức.

Rollback: deploy lại archive/full-28-tables (qua một commit phát hành mới hoặc đổi nhánh deploy); bản đầy đủ tiếp tục dùng schema dut_connect cũ. Các thao tác mới phát sinh trong schema giữa kỳ không tự đồng bộ ngược vào bản đầy đủ; cần xuất/chuyển có chọn lọc nếu muốn mang theo.

## Tích hợp và phạm vi

AI matching tắt mặc định (AI_ENABLED=false). Nếu muốn gọi AI thật, cấu hình AI_BASE_URL, AI_API_KEY và AI_MODEL ở backend; không đặt key vào VITE_*. Không có giả lập trả kết quả thành công khi thiếu key.

Google OAuth, thanh toán/quyên góp, tài chính, nhiệm vụ và giờ công được hoãn khỏi bản giữa kỳ. Các menu/API tương ứng đã bỏ; xem bảng chức năng đã có và chưa làm trong docs/midterm-report.md.
