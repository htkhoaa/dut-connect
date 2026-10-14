# Kiểm tra thay đổi sản phẩm — 14/10/2026

Đã đọc toàn bộ `spec.md`. Quy tắc email DUT, MSV, avatar và song ngữ theo yêu cầu mới của chủ dự án thay thế các giới hạn giao diện tương ứng trước đó. Giữ kiến trúc modular monolith, Flyway-only, dữ liệu server qua TanStack Query, token trong bộ nhớ và quyền hạn/state machine của core.

## Kết quả triển khai

| Yêu cầu | Kết quả |
|---|---|
| Nền rõ hơn nhưng vẫn nhẹ | Giảm độ phủ trắng của nền public/workspace, giữ card dễ đọc; kiểm tra ảnh chụp desktop/mobile |
| Bỏ chú thích ảnh | Gỡ nhãn trên ảnh và phần credit footer; nguồn vẫn được lưu trong tài liệu ảnh |
| Logo được cung cấp | Dùng nguyên ảnh kỷ niệm 51 năm cho header/footer/favicon; không AI chỉnh sửa |
| Dữ liệu hoạt động thật | V19 seed 6 hồ sơ công khai song ngữ có nguồn DUT, chi tiết và ảnh thật/campus; không tạo bản ghi tài chính hoặc chứng nhận tham gia giả |
| Khoa và đăng ký | 16 lựa chọn trong ảnh, loại Tất cả/Đào tạo & BĐCL/AEC; backend kiểm tra MSV 9 chữ số và email cùng MSV tại sv1.dut.udn.vn |
| Đăng nhập MSV | Giao diện gửi MSV/password; tài khoản admin và legacy được giữ. API email cũ tương thích các công cụ đã có |
| Avatar | V18, dịch vụ identity, API riêng của tài khoản, giới hạn/chuẩn hóa ảnh, version lock; dữ liệu lưu PostgreSQL |
| Scroll ngắn | Sidebar desktop dùng chiều cao nội dung và cuộn trang chung; giảm padding, bỏ panel phụ. Table chỉ cuộn ngang khi cần; dialog giữ cuộn khi nội dung vượt màn hình |
| VI/EN | Từ điển trong source, cập nhật nhãn và locale qua Zustand; không dịch dữ liệu người dùng hoặc gửi dữ liệu tới dịch vụ ngoài |
| dbdiagram | `dut-connect.dbml`: 27 bảng, 48 FK, 4 quan hệ 1–1; có composite PK, unique, checks và ghi chú index PostgreSQL. Parser DBML v2 đọc thành công |
| Báo cáo | `bao-cao-he-thong.md` gồm vai trò, toàn bộ luồng, chức năng, lý do tồn tại và giới hạn |

## Build và database

- `mvnw.cmd clean package -DskipTests`: BUILD SUCCESS, Java 21/Spring Boot 3.4.3.
- `npm.cmd run build`: TypeScript và Vite thành công.
- Docker backend/frontend build thành công; `docker compose config --quiet` hợp lệ; stack local có 3 service healthy.
- Stack kiểm tra riêng dùng PostgreSQL 16 trống và profile prod: 19 migration SQL V1–V19 áp dụng, Hibernate validate/health thành công; 27 bảng nghiệp vụ, 6 hoạt động và 0 users (không seed tài khoản giả).
- Volume local hiện có được giữ. Stack riêng không dùng volume dữ liệu sản phẩm. Không thêm test suite hoặc dependency kiểm thử; các kiểm tra dưới là thao tác chẩn đoán thủ công.

## Kiểm tra API và trình duyệt

- Đăng ký: MSV sai, email ngoài miền, email không khớp MSV, khoa bị loại đều trả 400. Dữ liệu hợp lệ trả 201; đăng nhập MSV trả 200. ADMIN cũ đăng nhập bằng mã đã cấu hình thành công.
- Avatar: anonymous GET trả 401; upload ảnh thật và đọc lại trả 200, dữ liệu chuẩn hóa 18.153 byte; nội dung SVG giả JPEG trả 400, version cũ trả 409. Ảnh hiển thị ở header/profile sau tải lại, phiên được giữ. Xóa ảnh có hộp xác nhận.
- Giao diện: trang chủ, đăng ký, đăng nhập, hồ sơ, hoạt động thật, dashboard/chi phí quản trị; VI→EN→VI không đăng xuất. Đổi ngôn ngữ hiển thị tiêu đề lịch sử tiếng Anh, lựa chọn khoa vẫn gửi giá trị tiếng Việt đúng backend. Form trả thông báo 9 chữ số bằng tiếng Anh trong EN.
- Có 17 option khoa gồm placeholder + 16 khoa; không có Đào tạo/AEC. Không còn nhãn “Ảnh tư liệu…” trên trang chủ.
- Màn hình đại diện 320/390/768/1440 px không tràn ngang; sidebar desktop không có overflow dọc. Ảnh tải được, không có exception JavaScript trong các lần duyệt.
- Gõ “Mùa hè” không Enter: hồ sơ lịch sử còn đúng một kết quả; trang chi tiết có nguồn bài 11414. API VI/EN trả đủ 6 hồ sơ. Nguồn và ảnh: `frontend/public/images/README.md`, `scripts/real-activity-content.mjs`.

## Giới hạn và rollout

Thông tin đăng ký chỉ xác nhận định dạng, chưa xác minh người dùng sở hữu email. Người xem/sinh viên trao đổi xem nội dung tiếng Anh; đăng ký vẫn cần mã/email DUT theo yêu cầu mới. Tài khoản cũ không bị sửa hoặc xóa. Không bật lại Google OAuth.

Hồ sơ lịch sử là nội dung tham khảo có nguồn, không phải đề xuất do một người trong DUT Connect tạo/duyệt và không nhận đóng góp. Số người, khoản chi, thanh toán, điểm danh và giờ công thực tế không được suy diễn từ bài báo. Ảnh Facebook của hai bài Khoa Môi trường trả 403; dùng ảnh campus gốc thay thế và ghi rõ nguồn trong tài liệu. Ngày “180/4/2021” trong bài hiến máu được giữ ở mức tháng 04/2021.

Phê duyệt tự động từ chối gửi chuỗi giao diện tới Google Translate; bản dịch dùng bộ từ điển cục bộ. Không có dữ liệu được gửi tới endpoint đó.

Production dùng Vercel proxy `/api` tới Render/Neon. Frontend/backend tự deploy theo commit nhưng có thể hoàn tất khác thời điểm; cần chờ backend mới Live để các API MSV, avatar và hoạt động thật sẵn sàng. Kiểm tra public API sau rollout; việc đăng nhập tài khoản quản trị production cần chủ tài khoản kiểm tra, vì không có mật khẩu production trong workspace. Thanh toán ZaloPay và AI vẫn phụ thuộc cấu hình riêng; mock không chạy trong prod.
