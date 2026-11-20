# Gửi lời cảm ơn sau chiến dịch

## Người nhận

- Chỉ quản lý chiến dịch hoặc quản trị hệ thống được gửi, sau khi chiến dịch COMPLETED.
- Người quyên góp: email của tài khoản có ít nhất một khoản PAID trong chiến dịch. Gộp các khoản của cùng người, không gửi cho giao dịch chờ, thất bại hoặc đã hoàn tiền.
- Tình nguyện viên: đăng ký ACCEPTED và hoàn thành VERIFIED.
- Email Outlook sinh viên là địa chỉ nhận thư. Đăng nhập DUT Connect không cấp quyền gửi thư từ hộp thư cá nhân đó; máy chủ dùng hộp thư gửi được cấu hình riêng.

## Xử lý kết quả

- Chỉ đánh dấu đã gửi sau khi dịch vụ email tiếp nhận. Tiếp nhận không bảo đảm thư đã vào inbox; người nhận cần kiểm tra cả spam/junk.
- Không hiển thị thành công nếu 0 thư được tiếp nhận. Liệt kê từng người chưa gửi được và mã lỗi kết nối/xác thực/tạo chứng nhận.
- V31 lưu SENDING/SENT/FAILED theo chiến dịch, tài khoản và hình thức đóng góp. Không gửi lại SENT hoặc SENDING; chỉ thử lại FAILED. Trạng thái SENDING sau sự cố cần kiểm tra log và hộp thư gửi trước khi xử lý thủ công, tránh gửi trùng.
- Nút thử lại chỉ gửi các khóa người nhận bị lỗi; địa chỉ email luôn được backend lấy lại từ dữ liệu đủ điều kiện, không nhận email tùy ý từ client.
- Lỗi thông báo trong ứng dụng không làm một thư đã được tiếp nhận bị báo thành thất bại.
- Docker runtime có fontconfig và DejaVu để tạo tệp PNG chứng nhận trên Linux.

## Cấu hình backend

Đặt trên dịch vụ backend Render, không đặt trong Vercel hoặc mã nguồn:

| Biến | Ý nghĩa |
|---|---|
| APP_MAIL_ENABLED | true khi đã cấu hình dịch vụ gửi thật |
| APP_MAIL_FROM | Hộp thư/địa chỉ được nhà cung cấp cho phép gửi; nếu không đặt thì dùng SPRING_MAIL_USERNAME |
| SPRING_MAIL_HOST | SMTP host do nhà cung cấp quy định |
| SPRING_MAIL_PORT | Cổng SMTP do nhà cung cấp quy định |
| SPRING_MAIL_USERNAME / SPRING_MAIL_PASSWORD | Thông tin xác thực của hộp thư gửi, chỉ lưu trong môi trường backend |
| SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH | Theo cấu hình của nhà cung cấp |
| SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE | true nếu dùng SMTP STARTTLS |

Render Free chặn kết nối outbound tới cổng SMTP 25/465/587. Nếu dịch vụ dùng gói Free và cổng này thì sửa mật khẩu sẽ không giải quyết lỗi mạng. Cần người sở hữu cấu hình một phương thức gửi được môi trường triển khai hỗ trợ; không tự nâng gói trả phí hoặc thay đổi quyền hộp thư.

Nguồn hạ tầng: https://render.com/docs/free ; tài liệu Microsoft 365 về SMTP AUTH: https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission . Việc chọn phương thức xác thực phải theo chính sách thực tế của nhà cung cấp; không mặc định tài khoản đăng nhập Microsoft trên web có thể dùng làm SMTP sender.
