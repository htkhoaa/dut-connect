# Triển khai bản giữa kỳ

Frontend Vercel: root frontend; npm ci / npm run build; output dist; VITE_API_BASE_URL=/api/v1. frontend/vercel.json chuyển /api tới https://dut-connect.onrender.com trước SPA fallback. Domain production https://dutconnect.vercel.app.

Backend Render: root backend, Dockerfile backend/Dockerfile theo root dịch vụ; profile prod, SERVER_PORT=8080, APP_JWT_SECRET đủ mạnh, datasource JDBC PostgreSQL/username/password đúng, APP_ALLOWED_ORIGINS=https://dutconnect.vercel.app. Dùng Environment của Render, không đưa bí mật vào source. Không cần biến ZaloPay/Google cho bản giữa kỳ. AI tắt mặc định.

Nhánh main là nhánh phát hành hiện tại. Bản đầy đủ nằm tại archive/full-28-tables; phát triển giữa kỳ tại midterm/19-tables. Chỉ đẩy commit giữa kỳ đã kiểm tra tới main sau khi đã đẩy nhánh lưu bản đầy đủ.

Backend tự tạo schema dut_connect_midterm với 19 bảng ứng dụng và metadata Flyway. Nếu schema dut_connect cũ tồn tại, V2 sao chép tài khoản/dữ liệu tương thích, không xóa hoặc cập nhật nguồn. Tài khoản DB cần quyền tạo schema và đọc schema cũ. Không đổi password, không xóa database Neon để chuyển phiên bản. Người dùng đăng nhập lại vì không chuyển refresh token.

Kiểm tra sau deploy: GET /api/v1/system/edition phải trả edition=MIDTERM và businessTableCount=19. Mở trang chủ/chiến dịch/tổ chức, kiểm tra bundle mới và các bộ lọc. Xem Render Logs nếu khởi động thất bại; không gửi password hoặc connection string có mật khẩu khi chia sẻ log. Render Free có thể chậm khi đánh thức.

Rollback: deploy lại source archive/full-28-tables bằng một commit phát hành mới hoặc chọn lại nhánh dịch vụ; schema dut_connect cũ còn nguyên. Dữ liệu phát sinh sau chuyển phiên bản nằm trong schema giữa kỳ, không tự đồng bộ về bản đầy đủ.
