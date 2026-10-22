# Giao diện Tailwind và dữ liệu DUT mẫu

Ngày kiểm tra: 03/10/2026. Đây là phần chỉnh sửa giao diện theo yêu cầu sau Phase 11. Các quy tắc nghiệp vụ trong `spec.md` vẫn được giữ; yêu cầu mới thay cổng công khai mặc định bằng **80**, dùng tiếng Việt và tắt Google OAuth.

## Mở sản phẩm

Bản Docker chạy tại **http://localhost:80** hoặc **http://localhost**. Bấm **Ctrl + F5** nếu trình duyệt còn lưu giao diện cũ.

```powershell
docker compose up -d --build --wait
```

Backend vẫn chạy cổng 8080 trong mạng Docker. Không thay URL health check hoặc upstream Nginx bằng cổng 80. Google OAuth không có nút trên giao diện và cấu hình Compose buộc tính năng này tắt. Mã/schema đã có được giữ để tránh xóa migration đã áp dụng.

Ảnh chụp bản Docker: [Desktop](ui-preview.png) · [Mobile 390px](ui-preview-mobile.png) · [Card tổ chức](ui-organizations-preview.png).

## Những phần đã thay đổi

- Tailwind CSS 4 qua Vite, bảng màu tập trung, typography tiếng Việt, khoảng cách thống nhất, nút, thẻ, huy hiệu trạng thái và các trạng thái tải/rỗng/lỗi.
- Trang chủ có ảnh lớn, lời giới thiệu, lựa chọn hình thức đóng góp, chiến dịch và tổ chức lấy từ API.
- Danh sách chiến dịch có tìm kiếm, bộ lọc, thẻ ảnh, tiến độ gây quỹ và phân trang. Trang chi tiết có kế hoạch, kỹ năng, tài chính và hành động tham gia.
- Tổ chức có thẻ nhận diện, mô tả riêng và các chiến dịch liên quan. API danh sách trả thêm mô tả; truy vấn đọc và DTO được cập nhật đồng bộ.
- Đăng nhập/đăng ký có bố cục ảnh và biểu mẫu, hiện/ẩn mật khẩu, thông báo tiếng Việt. Hồ sơ có ảnh đại diện bằng chữ, khoa, mã sinh viên và kỹ năng.
- Không gian sinh viên, quản lý và quản trị có sidebar, các thẻ thống kê và điều hướng rõ ràng. Mobile dùng menu đóng/mở, khóa cuộn, giữ focus và đóng bằng Escape.
- Ảnh thật: 4 ảnh khuôn viên do người dùng cung cấp trong `image/`, thêm 2 ảnh hoạt động từ website DUT. Ảnh AI trước đó đã được gỡ khỏi tài nguyên public. Nền ảnh có lớp phủ sáng trên mọi route; card tổ chức và trang chi tiết cũng có ảnh. [Danh sách ảnh và nguồn](../frontend/public/images/README.md).
- Tìm kiếm chiến dịch, tổ chức và đề xuất tự gửi truy vấn sau khi ngừng nhập 300 ms, không cần Enter. Đổi trạng thái/lĩnh vực/tổ chức vẫn cập nhật ngay; thay truy vấn trả phân trang về trang đầu.

## Dữ liệu mẫu

```powershell
node scripts/seed-demo.mjs
```

Chỉ dùng trên localhost với profile `dev`. Trình nhập giữ dữ liệu cũ, lưu tiến độ và tái sử dụng các bản ghi đã tạo khi chạy lại. Thời gian chiến dịch tính theo ngày nhập lần đầu.

| Nội dung | Số lượng / ví dụ |
| --- | --- |
| Tài khoản sinh viên | 6: tổ chức, kỹ thuật, hậu cần, người ủng hộ, ứng viên, người quản lý |
| Tổ chức | 6: Đoàn trường, Hội Sinh viên, Liên chi đoàn CNTT, đội Công tác xã hội, CLB Công nghệ Sáng tạo, đội Sinh viên xanh |
| Chiến dịch | 8: Ánh sáng vùng cao, Bách khoa số, Tủ sách yêu thương, DUT Buddy, STEM cuối tuần, Tiếp sức mùa thi, Mùa hè xanh, Chủ nhật xanh |
| Trạng thái | 1 hoàn thành, 1 đang triển khai, 6 đang tuyển |
| Hình thức | Tình nguyện, ủng hộ tài chính, kết hợp |

Dữ liệu chiến dịch/tổ chức là ví dụ hư cấu để trình diễn, không phải sự kiện hoặc số liệu chính thức của DUT. Ảnh là ảnh thật của trường, có nguồn riêng, không đại diện cho từng sự kiện mẫu. Bản ghi có nhãn **Dữ liệu mẫu**, ảnh có nhãn **Ảnh tư liệu DUT** hoặc **Ảnh khuôn viên DUT**. Trình nhập dùng API nghiệp vụ để tạo đề xuất, duyệt tổ chức/chiến dịch, tiếp nhận tình nguyện viên, nhiệm vụ, điểm danh, kết quả hoàn thành và chi phí. Các khoản đóng góp được thanh toán qua callback mock của backend, không phải số tiền thật.

Email/mật khẩu được tạo riêng tại `.local/demo-accounts.json`, trong `people.<role>.values`. Các khóa: `organizer`, `technical`, `logistics`, `donor`, `applicant`, `manager`. Không đưa tệp này hoặc `.env` lên Git. Tài khoản quản trị dùng cấu hình bootstrap hiện có.

Số liệu kiểm tra của chiến dịch Chủ nhật xanh: đóng góp đã xác nhận 1.500.000 VND, tổng kinh phí 5.000.000 VND, chi phí đã duyệt 300.000 VND, còn lại 4.700.000 VND, 3 lượt đóng góp thành công. Chiến dịch Ánh sáng vùng cao có tổng giờ chính thức đã xác minh 20,50. Đây là tổng backend tính từ bản ghi, không phải hằng số trong UI.

## Kiểm tra thực tế

- Backend: `mvnw.cmd clean package -DskipTests` thành công với Java 21 / Spring Boot 3.4.3.
- Frontend: `npm.cmd run build` thành công, gồm TypeScript và Vite/Tailwind.
- Docker: build backend/frontend thành công; `docker compose config --quiet` hợp lệ; PostgreSQL, backend và frontend đều healthy, frontend xuất bản cổng 80.
- Một stack kiểm tra riêng dùng cơ sở dữ liệu mới đã áp dụng V1–V17 và khởi động với Hibernate `ddl-auto=validate`. Stack sản phẩm giữ volume hiện có.
- Trình nhập dữ liệu mẫu chạy thành công và chạy lại nhận đúng 8 chiến dịch đã có.
- Đã duyệt màn hình công khai, 9 màn hình sinh viên, 10 màn hình quản lý chiến dịch và 7 màn hình quản trị bằng trình duyệt cục bộ riêng. Kiểm tra chiều rộng 320/390/768/1440px ở các màn hình đại diện; không tràn ngang, ảnh tải được.
- Đăng nhập, tải lại trang giữ phiên, đăng xuất, thông báo sai mật khẩu bằng tiếng Việt và hiện/ẩn mật khẩu đã được kiểm tra.
- Menu mobile giữ focus bên trong, Escape trả focus về nút mở menu và phục hồi cuộn; đổi sang desktop bỏ overlay.
- Hai nút tải báo cáo tình nguyện/tài chính trả HTTP 200 và tải hoàn tất tệp Excel.

Các lần kiểm tra này là kiểm tra thủ công phục vụ thay đổi giao diện; không thêm bộ kiểm thử tự động và không thay thế báo cáo kiểm tra nghiệp vụ của các phase trước. ZaloPay thật và mô hình AI thật vẫn phụ thuộc cấu hình dịch vụ riêng; dữ liệu mẫu dùng mock thanh toán. Lý do gợi ý AI được yêu cầu trả bằng tiếng Việt khi AI được bật.

## Cập nhật ảnh thật, nền trang và danh sách demo

Theo yêu cầu tiếp theo, bản demo hiện liệt kê 8 chiến dịch, 6 tổ chức, 8 đề xuất và 6 lĩnh vực có tên phù hợp. Các bản ghi kiểm tra cũ được **ẩn khỏi danh sách**, không bị xóa. Kiểm tra phê duyệt tự động từ chối dọn hàng loạt vì phạm vi liên quan cả lịch sử thanh toán; giải pháp được áp dụng là bộ lọc đọc theo danh sách UUID cụ thể, chỉ trong môi trường dev.

```powershell
node scripts/configure-demo-catalog.mjs --apply
docker compose up -d --wait
```

Danh sách chính xác tên/ID ở `.local/catalog-exclusions.json`; bốn biến `APP_DEMO_CATALOG_*_IDS` lưu trong `.env`. Có thể xóa giá trị của bốn biến rồi khởi động lại backend để xem toàn bộ bản ghi. Production bỏ qua cấu hình này, kể cả khi bật đồng thời dev và prod. Không sửa migration, không ghi/xóa dữ liệu nghiệp vụ. Bộ lọc áp dụng trước cả truy vấn đếm và truy vấn lấy trang; dùng TanStack Query với các khóa truy vấn riêng.

Kiểm tra SQL xác nhận 271 chiến dịch, 19 tổ chức, 281 đề xuất và 158 khoản đóng góp/158 giao dịch vẫn được giữ. Tổng tài chính chiến dịch Chủ nhật xanh không thay đổi. Trang dashboard vẫn phản ánh toàn bộ lịch sử hệ thống; đường dẫn trực tiếp và báo cáo cũ vẫn truy cập theo quyền hiện có.

Đã kiểm tra trên bản Docker: tìm “STEM” bằng cách nhập, không nhấn Enter, tự trả một chiến dịch và một đề xuất; tìm “Công nghệ” tự trả hai tổ chức; xóa từ khóa phục hồi danh sách, từ khóa không có kết quả hiển thị trạng thái rỗng. Tìm “Phase” trong danh sách chiến dịch trả 0. Sáu card tổ chức đều có ảnh. Kiểm tra các trang đại diện ở 320/390/768/1440 px không tràn ngang, không ảnh hỏng và không lỗi JavaScript. Các trang đăng nhập, hồ sơ, không gian quản lý và quản trị có nền ảnh thật.
