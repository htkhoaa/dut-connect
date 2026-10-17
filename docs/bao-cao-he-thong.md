# DUT Connect — Báo cáo bản giữa kỳ

Bản giữa kỳ có **19 bảng ứng dụng**, tập trung quản lý chiến dịch tình nguyện. Giữ thiết kế UI, ảnh thật DUT, logo, background, card, nút, tìm kiếm động, responsive và VI/EN.

Source bản đầy đủ 28 bảng nằm trên nhánh `archive/full-28-tables`; source giữa kỳ nằm trên `midterm/19-tables`. Nhánh `main` phục vụ triển khai. [DBML để dán vào dbdiagram.io](dut-connect-midterm.dbml).

## 1. Giải thích 19 bảng

| STT | Bảng | Chức năng và lý do tồn tại |
|---|---|---|
| 1 | `users` | Tài khoản, MSV/email duy nhất, tên, mật khẩu BCrypt, vai trò ADMIN/USER, trạng thái hoạt động/đình chỉ. Là định danh chung cho các nghiệp vụ. |
| 2 | `student_profiles` | Khoa, giới thiệu, kinh nghiệm, nhóm đóng góp của sinh viên. Tách thông tin hồ sơ khỏi dữ liệu đăng nhập. Liên kết 1–1 với users. |
| 3 | `refresh_tokens` | Hash của refresh token, hạn dùng, thu hồi và token thay thế. Giữ đăng nhập qua reload và đăng xuất có hiệu lực; không lưu token gốc. |
| 4 | `profile_avatars` | Ảnh đại diện đã kiểm tra và chuẩn hóa, liên kết 1–1 với users. Lưu database để ảnh không mất khi backend restart; chỉ tài khoản đó được truy cập API ảnh của mình. |
| 5 | `organization_types` | Danh mục Đoàn trường, Liên chi đoàn, Hội, CLB, Đội… Tránh nhập loại tổ chức thiếu thống nhất. |
| 6 | `organizations` | Tên, mô tả, loại, slug, trạng thái và người tạo/xác minh tổ chức. Phục vụ trang tổ chức và kiểm tra điều kiện đại diện tổ chức. |
| 7 | `organization_members` | Quan hệ nhiều–nhiều người dùng–tổ chức, vai trò OWNER/MANAGER/MEMBER. Cho phép phân quyền và chuyển chủ sở hữu; không tự cấp quyền quản lý chiến dịch. |
| 8 | `campaign_categories` | Danh mục chiến dịch để phân loại, tìm/lọc và quản trị. Ngừng dùng danh mục không xóa lịch sử chiến dịch. |
| 9 | `proposals` | Kế hoạch do cá nhân hoặc đại diện tổ chức gửi, trạng thái chờ/duyệt/từ chối và lý do. Giữ bước xét duyệt trước khi chiến dịch được mở tuyển. |
| 10 | `campaigns` | Thông tin chiến dịch vận hành: nội dung, tổ chức, danh mục, ngày, hạn tuyển, chỉ tiêu, trạng thái. Liên kết duy nhất với đề xuất đã duyệt để ngăn tạo trùng. |
| 11 | `campaign_managers` | Người quản lý theo từng chiến dịch và vai trò OWNER/MANAGER. Giữ quyền điều phối theo phạm vi, không tạo vai trò ORGANIZER toàn hệ thống. |
| 12 | `skills` | Danh mục kỹ năng dùng chung, tránh mỗi sinh viên/chiến dịch đặt tên kỹ năng khác nhau. |
| 13 | `student_skills` | Quan hệ nhiều–nhiều sinh viên–kỹ năng, thể hiện kỹ năng trong hồ sơ. |
| 14 | `campaign_skill_requirements` | Kỹ năng cần cho chiến dịch, nhóm kỹ thuật/hậu cần và mức quan trọng. Hỗ trợ xét tuyển thủ công và tích hợp AI tùy chọn. |
| 15 | `volunteer_registrations` | Hồ sơ ứng tuyển, nguyện vọng, lý do, thời gian rảnh, kết quả xét duyệt và nhóm được nhận. Ràng buộc mỗi người chỉ có một hồ sơ cho mỗi chiến dịch. |
| 16 | `meetings` | Lịch họp chiến dịch, thời gian, online/offline, địa điểm hoặc URL. Người được nhận và quản lý xem được; quản lý mới được sửa. |
| 17 | `attendance_sessions` | Từng buổi điểm danh với thời gian và người tạo. Không dùng một cờ điểm danh chung cho cả chiến dịch. |
| 18 | `attendance_records` | Có mặt/vắng mặt của từng người trong từng buổi, người ghi và thời điểm. Chỉ ghi cho người đã được nhận; không tự quy đổi thành giờ tình nguyện. |
| 19 | `published_activities` | Tư liệu hoạt động thực tế DUT: nội dung VI/EN, ảnh, nguồn, thời gian công bố. Giữ trang chủ sinh động mà không biến lịch sử thành đợt tuyển mới. |

`flyway_schema_history` là bảng metadata phục vụ migration, **không phải bảng nghiệp vụ thứ 20**. DBML có 19 bảng và 33 khóa ngoại. Khóa `seed_key` trên organizations/campaigns thay thế bảng theo dõi import riêng.

Các cột kế hoạch kinh phí cũ trong proposals/campaigns được giữ để tương thích dữ liệu sao chép; không có UI tài chính, không có bảng thanh toán và backend từ chối nhập kế hoạch tài chính mới. Bản giữa kỳ chỉ hỗ trợ VOLUNTEER_ONLY.

## 2. Luồng hoạt động

**Tài khoản → tổ chức/đề xuất → ADMIN xét duyệt → mở chiến dịch → tuyển sinh viên → lịch họp → điểm danh → dashboard/Excel.**

1. Sinh viên đăng ký bằng MSV 9 chữ số và email tương ứng `MSV@sv1.dut.udn.vn`, chọn khoa; đăng nhập bằng MSV. Backend kiểm tra lại và ngăn trùng tài khoản.
2. Sinh viên cập nhật hồ sơ, kỹ năng, avatar; tạo tổ chức hoặc tham gia tổ chức do chủ sở hữu quản lý. Tổ chức cần xác minh trước khi đại diện gửi đề xuất.
3. Cá nhân hoặc người có quyền đại diện gửi đề xuất. ADMIN duyệt/từ chối; duyệt đồng thời tạo đúng một chiến dịch DRAFT và OWNER trong transaction.
4. Quản lý hoàn thiện yêu cầu kỹ năng, thêm quản lý hợp lệ và chuyển chiến dịch OPEN. Sinh viên gửi đăng ký; quản lý nhận/từ chối và phân nhóm. Không cho đăng ký trùng hoặc người không có quyền tự nhận hồ sơ.
5. Người được nhận xem lịch họp. Quản lý tạo buổi điểm danh và ghi có mặt/vắng mặt. Version cũ bị từ chối để tránh ghi đè kết quả người khác vừa lưu.
6. Dashboard phản ánh đăng ký, nhóm, lịch họp và điểm danh. Excel xuất đúng danh sách chiến dịch, không có cột tài chính hoặc giờ công chưa được hỗ trợ.

## 3. Chức năng đã có và đã xác minh chạy được

Các lượt HTTP và kiểm tra trình duyệt được thực hiện trên môi trường cô lập, không tạo dữ liệu kiểm tra vào production.

| Nhóm | Đã triển khai và kiểm tra |
|---|---|
| Tài khoản | Đăng ký, đăng nhập ADMIN/USER, refresh xoay vòng, logout thu hồi phiên, đình chỉ và khôi phục tài khoản |
| Hồ sơ | Đọc/cập nhật thông tin, gắn kỹ năng; upload/đọc/xóa avatar, ảnh trả về JPEG chuẩn hóa |
| Tổ chức | Danh sách/chi tiết, tạo, xác minh, đình chỉ/khôi phục, thêm thành viên và chuyển quyền sở hữu |
| Đề xuất | Tạo đề xuất tổ chức; duyệt thành chiến dịch; duyệt lặp bị chặn và không tạo chiến dịch thứ hai |
| Chiến dịch | Danh sách/chi tiết, lọc trạng thái, yêu cầu kỹ năng, thêm/bỏ quản lý; mở/bắt đầu/hoàn thành; chặn mở lại trạng thái cuối |
| Tình nguyện | Gửi hồ sơ, chặn trùng, quản lý nhận/phân nhóm, hủy hồ sơ đang chờ; người ngoài không được xét duyệt |
| Lịch họp | Tạo lịch offline; người được nhận xem được, người ngoài bị từ chối |
| Điểm danh | Tạo buổi, ghi/đọc có mặt, chặn cập nhật bằng version cũ |
| Quản trị | Dashboard theo phạm vi mới; tạo/ngừng dùng danh mục; chặn USER vào API ADMIN |
| Báo cáo | Tải file Excel hợp lệ gồm thông tin đăng ký/nhóm/điểm danh; không có báo cáo tài chính |
| UI | Trang chủ, chiến dịch, quản lý và form đề xuất giữ thiết kế; không còn link tới mảng đã hoãn; VI/EN hoạt động, 320/390/768/1440px không tràn ngang |
| Tư liệu DUT | Card và ảnh thật tải được; hồ sơ công khai có nguồn và nội dung VI/EN |
| Database | Khởi tạo mới 19 bảng; chuyển dữ liệu tương thích từ fixture 28 bảng; fingerprint cả 28 bảng nguồn không thay đổi |

Các thao tác sửa/xóa họp, sửa buổi điểm danh, từ chối hồ sơ/đề xuất và quản lý chi tiết vai trò vẫn được giữ trong code/UI. Bộ kiểm tra đã chạy các luồng đại diện nêu trên, không khẳng định mọi tổ hợp thao tác đã được kiểm tra toàn diện.

## 4. Chưa có trong bản giữa kỳ

| Chức năng | Trạng thái |
|---|---|
| Google OAuth | Đã đưa khỏi bản giữa kỳ |
| Quyên góp, ZaloPay, mock checkout, callback, lịch sử thanh toán | Hoãn cuối kỳ; không còn controller/route/entity/repository trong bản build |
| Gửi/duyệt chi phí, tài trợ, tổng hợp và báo cáo tài chính | Hoãn cuối kỳ |
| Tạo nhiệm vụ, phân công người làm, xác minh nhiệm vụ | Hoãn cuối kỳ |
| Xác minh sinh viên hoàn thành và chứng nhận giờ công | Hoãn cuối kỳ; điểm danh không thay thế chứng nhận giờ |
| AI matching gọi dịch vụ thật | Adapter và giao diện còn; mặc định disabled. Đã kiểm tra availability=false, chưa xác minh kết quả AI thật vì chưa có API key cấu hình cho lần kiểm tra này |
| Email xác thực/khôi phục mật khẩu, SSO, thông báo, đồng bộ điểm công tác xã hội | Chưa triển khai trong phạm vi giữa kỳ |

“Chưa có trong bản giữa kỳ” không đồng nghĩa chưa từng viết: các phần bị hoãn đã được bảo toàn trong nhánh bản đầy đủ. AI không trả kết quả giả khi chưa cấu hình.

## 5. Dữ liệu và triển khai

- Có bộ seed 5 tổ chức, 8 chiến dịch đủ trạng thái và 6 hồ sơ hoạt động thực tế. DRAFT chỉ dành cho người có quyền; khách thấy 7 chiến dịch seed công khai.
- Lịch/chỉ tiêu/trạng thái vận hành là mô phỏng theo yêu cầu, có nhãn; bài gốc và thời gian lịch sử được ghi riêng. Không seed tài khoản đại diện giả, tiền hoặc giờ công giả.
- Vercel phục vụ frontend, Render phục vụ backend, Neon giữ PostgreSQL. Schema mới `dut_connect_midterm` có 19 bảng; schema `dut_connect` cũ được giữ để rollback, không tham gia các truy vấn nghiệp vụ bản giữa kỳ.
- Tài khoản và dữ liệu tương thích được sao chép một lần. Người dùng đăng nhập lại vì không chuyển refresh token. Dữ liệu mới giữa kỳ không tự đồng bộ ngược vào bản đầy đủ.
- Kiểm tra bản đang chạy bằng `GET /api/v1/system/edition`; số bảng trả về được đọc từ database thực tế, không phải số giả lập.
