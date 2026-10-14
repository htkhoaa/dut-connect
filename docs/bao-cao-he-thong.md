# DUT Connect — Báo cáo chức năng và luồng xử lý

DUT Connect tổ chức hoạt động tình nguyện, điều phối sinh viên và theo dõi đóng góp tài chính của cộng đồng Bách khoa Đà Nẵng. Mục tiêu là thay các biểu mẫu, danh sách điểm danh và bảng tính rời rạc bằng một luồng có quyền hạn, trạng thái và dữ liệu kiểm chứng được.

## 1. Người dùng và quyền hạn

| Vai trò | Công việc | Vì sao cần |
|---|---|---|
| Khách | Xem chiến dịch, tổ chức đã xác minh, hồ sơ hoạt động thực tế và tài chính công khai | Tiếp cận thông tin trước khi tham gia; hỗ trợ người xem và sinh viên trao đổi qua VI/EN |
| Sinh viên USER | Quản lý hồ sơ/avatar/kỹ năng; đề xuất; tham gia tổ chức; đăng ký tình nguyện; thực hiện nhiệm vụ; đóng góp; xem lịch sử | Một hồ sơ xuyên suốt thay cho nhập lại thông tin ở từng chiến dịch |
| OWNER/MANAGER tổ chức | Quản lý thành viên, chuyển chủ sở hữu, đại diện tổ chức đã xác minh để đề xuất | Có người chịu trách nhiệm và ngăn đại diện tổ chức tùy tiện |
| OWNER/MANAGER chiến dịch | Điều phối chiến dịch cụ thể: tuyển người, phân công, họp, điểm danh, xác minh hoàn thành, gửi chi phí, AI, báo cáo | Quyền giới hạn theo chiến dịch; thành viên tổ chức không tự có quyền quản lý chiến dịch |
| ADMIN | Xác minh tổ chức, duyệt đề xuất/chi phí, quản lý trạng thái tài khoản, danh mục, chiến dịch, dashboard và báo cáo | Tách người tổ chức hoạt động khỏi người xét duyệt các quyết định quan trọng |

Hệ thống chỉ có hai vai trò toàn cục ADMIN/USER; quyền tổ chức và chiến dịch nằm ở bảng thành viên tương ứng.

## 2. Luồng hoạt động chính

**Tài khoản → tổ chức/đề xuất → xét duyệt → mở chiến dịch → tuyển chọn → điều phối → xác minh → báo cáo.**

1. **Đăng ký:** mã sinh viên đúng 9 chữ số; email phải khớp `<mã>@sv1.dut.udn.vn`; chọn khoa từ danh sách được cung cấp. Backend kiểm tra lại, ngăn trùng email/MSV và mã hóa mật khẩu BCrypt. Kiểm tra định dạng không chứng minh sở hữu email; chưa tích hợp xác thực email/SSO.
2. **Đăng nhập:** dùng MSV và mật khẩu. Tài khoản quản trị đã có như `ADMIN001` tiếp tục sử dụng mã đó; tài khoản cũ được giữ. Access JWT ở bộ nhớ; refresh token ở cookie HttpOnly/Secure trong production, chỉ hash được lưu trong database. Refresh xoay token, logout thu hồi phiên; tài khoản bị đình chỉ không được dùng chức năng bảo vệ. API đăng nhập bằng email cũ còn được giữ để tương thích công cụ hiện có, giao diện dùng MSV.
3. **Hồ sơ:** sinh viên khai khoa, mô tả, kinh nghiệm, nhóm TECHNICAL/LOGISTICS và kỹ năng. Avatar PNG/JPEG tối đa 1 MB, giới hạn 8 megapixel/4096 px mỗi chiều, được backend kiểm tra và chuẩn hóa JPEG 256×256. Ảnh nhỏ lưu trong PostgreSQL, truy cập qua API của chính tài khoản; không mất khi Render restart và không cần dịch vụ lưu file riêng.
4. **Tổ chức:** người tạo là OWNER; tổ chức ban đầu chờ xác minh. ADMIN xác minh/đình chỉ/khôi phục. OWNER phân vai thành viên và chuyển quyền sở hữu; không thể bỏ chủ sở hữu cuối cùng.
5. **Đề xuất:** cá nhân hoặc đại diện có quyền của tổ chức VERIFIED gửi kế hoạch, thời gian, tuyển người, yêu cầu kỹ năng và kinh phí. Chỉ đề xuất PENDING được sửa. ADMIN duyệt hoặc từ chối có lý do; duyệt đồng thời tạo đúng một chiến dịch DRAFT và OWNER trong một transaction. Điều này ngăn duyệt thành công nhưng thiếu chiến dịch, hoặc tạo trùng khi thao tác lặp.
6. **Chiến dịch:** OWNER hoàn thiện rồi chuyển `DRAFT → OPEN → ACTIVE → COMPLETED`; có thể CANCELLED trước khi hoàn thành. Trạng thái cuối không mở lại. Quy tắc tuyển/nhận tiền phụ thuộc trạng thái, hình thức VOLUNTEER_ONLY/DONATION_ONLY/HYBRID và thời hạn.
7. **Tuyển tình nguyện:** mỗi sinh viên chỉ có một hồ sơ cho một chiến dịch. Đăng ký là PENDING, không tự được nhận. Người quản lý ACCEPT/REJECT; sinh viên chỉ hủy hồ sơ đang chờ. Khi nhận, quản lý chọn nhóm cuối cùng; vượt chỉ tiêu phải có cảnh báo và xác nhận.
8. **Điều phối:** người đã ACCEPTED mới được phân công nhiệm vụ và điểm danh. Nhiệm vụ đi từ TODO tới IN_PROGRESS, DONE rồi VERIFIED; quản lý có thể trả lại để sửa trước khi VERIFIED. Họp ONLINE cần liên kết, OFFLINE cần địa điểm. Điểm danh theo từng buổi, lưu hàng loạt nguyên tử, không dùng một cờ cho toàn chiến dịch.
9. **Hoàn thành:** điểm danh thể hiện hiện diện; hoàn thành thể hiện kết quả. Người quản lý ghi nhận và xác minh số giờ chính thức. Báo cáo chỉ cộng giờ VERIFIED để tránh biến việc có mặt thành thành tích được chứng nhận.

## 3. Thanh toán và tài chính

Sinh viên chọn số tiền; backend kiểm tra điều kiện rồi tạo Donation và PaymentTransaction. Gọi nhà cung cấp ngoài transaction, sau đó lưu kết quả. ZaloPay Sandbox callback phải có MAC hợp lệ, đúng đơn hàng/số tiền; backend khóa giao dịch và cập nhật PAID nguyên tử. Callback lặp không cộng tiền hai lần; trang kết quả đọc trạng thái từ server, không tin tham số “success”.

Mock chỉ hoạt động trong dev và vẫn đi qua luồng xác minh. Production không bật mock; cần thông tin ZaloPay để thanh toán sandbox hoạt động. Chưa có thu tiền thật hay quy trình hoàn tiền vận hành.

Quản lý gửi chi phí PENDING, ADMIN duyệt/từ chối có lý do. **Tổng kinh phí = kinh phí nhà trường + tài trợ + donation PAID. Số dư = tổng kinh phí − chi phí APPROVED.** Backend tính từ database, dùng `numeric`/BigDecimal cho VND. Khoản chờ/thất bại và chi phí chưa duyệt không ảnh hưởng tổng. Công khai chi phí đã duyệt; danh tính người đóng góp chỉ có trong màn hình/báo cáo có quyền.

## 4. AI, dashboard và báo cáo

| Chức năng | Xử lý và lý do |
|---|---|
| AI matching | Đối chiếu yêu cầu, kỹ năng, kinh nghiệm, thời gian; không gửi email/MSV/thanh toán. Trả gợi ý, không tự nhận người. AI lỗi/tắt không chặn xét duyệt thủ công |
| Dashboard ADMIN | Tổng hợp hoạt động, việc chờ duyệt, giờ đã xác minh, tiền đã thanh toán. Không tính tỷ lệ tham gia toàn trường khi chưa biết tổng sinh viên |
| Dashboard chiến dịch | Hồ sơ ứng tuyển, nhóm đã nhận, nhiệm vụ, điểm danh, hoàn thành và tài chính để quản lý theo dõi tiến độ |
| Excel tình nguyện | Danh sách đúng chiến dịch, trạng thái, điểm danh và giờ VERIFIED phục vụ tổng kết |
| Excel tài chính | Summary, Donations, Expenses; chỉ OWNER/MANAGER/ADMIN được tải. Giữ số tiền và định danh chính xác |

## 5. Dữ liệu thật, giao diện và vận hành

Sáu hồ sơ công khai được tổng hợp từ website DUT, gồm Mùa hè xanh, lễ ra quân Xuân tình nguyện, hiến máu, Chủ nhật xanh và hỗ trợ hướng nghiệp. Hồ sơ có nội dung VI/EN, nguồn, thời gian, đơn vị và ảnh thật; ảnh campus dùng khi ảnh bài gốc không còn tải được. Chúng nằm trong `published_activities`, không tạo donation, giờ VERIFIED hay biên bản duyệt giả. Hoạt động quá khứ không nhận đăng ký/tiền. Ngày lỗi trong nguồn hiến máu được ghi theo tháng, không tự đoán ngày.

Giao diện có ảnh nền nhẹ, logo do chủ dự án cung cấp, lọc sau 300 ms, phân trang và trạng thái tải/rỗng/lỗi. VI/EN áp dụng cho giao diện và hồ sơ lịch sử; nội dung người dùng nhập giữ nguyên ngôn ngữ gốc. Chọn ngôn ngữ không đăng xuất hoặc mất nội dung form. Danh sách khoa giữ các hậu tố trong ảnh để không tự suy diễn cơ cấu khoa mới.

Backend là modular monolith Java 21/Spring Boot 3.4.3: controller → application use case → domain/repository port → infrastructure. Frontend React/TypeScript dùng TanStack Query cho dữ liệu server, Zustand cho phiên và ngôn ngữ; token không lưu vào localStorage. Flyway quản lý schema, Hibernate chỉ validate; khóa và version bảo vệ cập nhật đồng thời.

Local chạy PostgreSQL/backend/Nginx bằng Compose. Production dùng Neon, Render và Vercel; proxy `/api` giữ cookie dưới domain frontend, Origin được cấu hình rõ. Render Free có thời gian đánh thức, nên request đầu có thể cần thử lại. Khóa/mật khẩu nằm ở biến môi trường, không ở Git. [DBML](dut-connect.dbml) mô tả schema thực tế; Flyway vẫn là nguồn schema chính thức.

Phạm vi không gồm chat, mạng xã hội, đồng bộ điểm công tác xã hội chính thức, email/SMS, SSO, PDF hay bộ kiểm thử tự động. Các giới hạn này giữ dự án tập trung vào điều phối, xác minh và minh bạch thay vì mở thêm hệ thống ngoài mục tiêu.


Cập nhật danh mục: 5 hồ sơ tổ chức dựa trên nguồn DUT và 8 chiến dịch vận hành được tạo qua quy trình nghiệp vụ. Ngày, chỉ tiêu và trạng thái được mô phỏng, có phân biệt với sự kiện gốc. Lịch đang tuyển kéo dài 120 ngày, lịch đang hoạt động thêm 180–200 ngày; khởi động lại không tạo trùng và không sửa dữ liệu đang dùng. ADMIN quản lý các hồ sơ trải nghiệm, không có tài khoản hoặc giao dịch tài chính giả. Migration V20 bổ sung bảng theo dõi import; DBML hiện có 28 bảng nghiệp vụ.
