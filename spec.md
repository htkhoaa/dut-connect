# DUT Connect — đặc tả bản giữa kỳ

Đặc tả này áp dụng cho nhánh midterm/19-tables theo phạm vi người dùng đã chọn ngày 17/10/2026. Bản đầy đủ và đặc tả 11 phase được bảo toàn trên nhánh archive/full-28-tables. Không áp dụng các yêu cầu thanh toán, tài chính, nhiệm vụ hay xác minh giờ công của bản đầy đủ cho nhánh này.

## Mục tiêu

Có UI hoàn chỉnh, database 19 bảng và các luồng nghiệp vụ có thể demo từ đầu đến cuối. Giữ thiết kế xanh/trắng DUT, logo, ảnh thật, background, card, nút, responsive, tìm kiếm động và VI/EN.

## Kiến trúc và ràng buộc

- Java 21, Spring Boot 3.4.3, Maven; PostgreSQL 16 production; Flyway tạo schema, Hibernate chỉ validate.
- React/TypeScript/Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, Axios.
- Modular monolith theo domain. Controller chỉ gọi application service, không trả entity hoặc gọi repository trực tiếp.
- Cross-module dùng UUID scalar và application/read port. Transaction bao trùm thay đổi nguyên tử. Giữ optimistic locking, quyền và ràng buộc database.
- USER/ADMIN là hai vai trò toàn cục. OWNER/MANAGER là quyền theo tổ chức/chiến dịch.
- Không thêm bộ unit/integration/E2E test tự động. Xác minh bằng các lượt kiểm tra thủ công có ghi kết quả.
- Không ghi bí mật vào Git, không lưu access token trong localStorage, không giảm an toàn đăng nhập để giảm bảng.

## Database — đúng 19 bảng ứng dụng

users, student_profiles, refresh_tokens, profile_avatars,
organization_types, organizations, organization_members,
campaign_categories, proposals, campaigns, campaign_managers,
skills, student_skills, campaign_skill_requirements,
volunteer_registrations, meetings, attendance_sessions, attendance_records, published_activities.

Schema ứng dụng là dut_connect_midterm. Bảng flyway_schema_history là metadata của framework, không tính vào 19 bảng nghiệp vụ. Schema dut_connect của bản đầy đủ được giữ nguyên để có thể quay lại phiên bản cũ; nếu database vốn chỉ chứa bản giữa kỳ thì không tạo schema bản đầy đủ.

Flyway chỉ đọc db/midterm. V1 tạo database giữa kỳ; V2 sao chép dữ liệu tương thích từ schema bản đầy đủ nếu tồn tại, không cập nhật/xóa dữ liệu nguồn. Chỉ sao chép đề xuất/chiến dịch VOLUNTEER_ONLY và các bản ghi phụ thuộc tương ứng. Không sao chép refresh token; người dùng đăng nhập lại sau chuyển phiên bản. Dữ liệu Google/thanh toán/nhiệm vụ/giờ công không chuyển vào bản giữa kỳ.

Không có bảng catalogue_seed_records. Khóa seed_key duy nhất trên tổ chức/chiến dịch cùng advisory lock làm bộ seed chạy lặp an toàn, giữ lịch và chỉnh sửa đã có. Khi chưa có ADMIN active, hoãn seed tới lần khởi động sau. Tên/nội dung lấy từ nguồn DUT; lịch/chỉ tiêu/trạng thái mô phỏng phải được phân biệt với lịch gốc.

## Chức năng giữ lại

1. Đăng ký MSV 9 chữ số, email tương ứng @sv1.dut.udn.vn, khoa theo danh sách; đăng nhập MSV, JWT và refresh cookie xoay vòng, logout, đình chỉ tài khoản.
2. Hồ sơ, kỹ năng, avatar PNG/JPEG kiểm tra/chuẩn hóa; chỉ truy cập avatar của chính tài khoản.
3. Tạo/sửa tổ chức; xác minh/đình chỉ/khôi phục; thêm/bỏ thành viên, phân quyền và chuyển chủ sở hữu.
4. Cá nhân hoặc đại diện tổ chức hợp lệ gửi/sửa đề xuất PENDING; ADMIN duyệt/từ chối. Duyệt tạo đúng một DRAFT campaign và OWNER trong cùng transaction.
5. DRAFT → OPEN → ACTIVE → COMPLETED; có thể CANCELLED trước trạng thái cuối. Không mở lại trạng thái cuối.
6. Danh mục, danh sách/chi tiết chiến dịch, lọc/tìm kiếm/phân trang; quản lý và kỹ năng yêu cầu theo chiến dịch.
7. Đăng ký PENDING; chỉ một lần mỗi sinh viên/chiến dịch; hủy khi đang chờ; quản lý nhận/từ chối và phân nhóm. Giữ kiểm tra trạng thái, hạn và chỉ tiêu.
8. Họp online/offline; người được nhận xem được lịch, người ngoài không được xem. Chỉ quản lý tạo/sửa/xóa.
9. Điểm danh nhiều buổi, chỉ cho người ACCEPTED; lưu hàng loạt nguyên tử, chặn version cũ và người không có quyền.
10. Dashboard chỉ tổng hợp nghiệp vụ còn lại; Excel chỉ gồm đăng ký, nhóm, điểm danh, không có cột tiền hoặc giờ công.
11. Hồ sơ hoạt động thật gồm ảnh, nguồn, thời gian gốc, nội dung VI/EN; không nhận đăng ký hay chứng nhận giờ công qua hồ sơ này.
12. AI matching giữ như tích hợp tùy chọn: tắt mặc định, không tự nhận người, không giả kết quả khi thiếu API key. Chỉ gọi adapter thật nếu có cấu hình hợp lệ.

## Chưa có trong bản giữa kỳ

Không có Google OAuth, donation/ZaloPay/mock checkout/callback, chi phí/tài chính, nhiệm vụ/phân công nhiệm vụ, xác minh hoàn thành/giờ công, báo cáo tài chính. Không có route, controller, entity hoặc repository tương ứng trong bản build. Những phần này vẫn có trên nhánh bản đầy đủ.

Các cột kế hoạch kinh phí cũ trên proposals/campaigns được giữ để sao chép schema tương thích; không có UI hoặc luồng xử lý tài chính. Backend từ chối nhập kế hoạch tài chính mới và chỉ chấp nhận VOLUNTEER_ONLY.

## Điều kiện hoàn tất

- Backend Maven và frontend build thành công.
- Schema ứng dụng có 19 bảng, DBML phản ánh database đang chạy.
- Kiểm tra luồng tổ chức → đề xuất → duyệt → tuyển người → họp → điểm danh → Excel và quyền tương ứng.
- Kiểm tra chuyển dữ liệu từ bản đầy đủ không làm thay đổi dữ liệu nguồn; seed chạy lại không trùng.
- Giao diện không còn liên kết tới chức năng bị hoãn; giữ ảnh thật, VI/EN và không tràn ngang trên điện thoại.
- Deploy bản giữa kỳ lên Vercel/Render hiện tại sau khi lưu nhánh bản đầy đủ; xác minh API production và giao diện mới.
