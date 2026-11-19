# Rà soát và sửa lỗi cho đồ án PBL

Ngày thực hiện: 19/11/2026. Nhánh: `codex/pbl-fixes`.

Mục tiêu là sửa các lỗi có tác động thực tế, giữ Spring Boot + React và cách tổ chức hiện tại để nhóm có thể đọc, chạy và bảo vệ đồ án. Các thay đổi dùng điều kiện kiểm tra, truy vấn SQL, component React dùng lại và unit test; không thêm dịch vụ hạ tầng.

## Lỗi và cách sửa

| Phần | Lỗi trước đây | Cách sửa |
| --- | --- | --- |
| Webhook PayOS | Không kiểm tra chữ ký; dữ liệu giả có thể được coi là đã thanh toán | Kiểm tra HMAC SHA256 trên các trường `data` đã sắp xếp, mã kết quả, tiền tệ, mã đơn và mã giao dịch |
| Kết quả webhook | Controller luôn báo thành công cả khi xử lý bị từ chối | Trả đúng kết quả; HTTP 400 cho dữ liệu bị từ chối, 503 khi tạm thời không xử lý được |
| Đối soát đơn | Tìm cả mã gần giống theo prefix/substring | Chỉ khớp chính xác provider và mã đơn |
| Cấu hình thanh toán | Thiếu khóa PayOS vẫn tạo QR vào tài khoản cá nhân ghi cứng | Cổng chưa cấu hình được báo chưa khả dụng; demo dùng provider `mock` ở môi trường dev |
| QR thanh toán frontend | Có thể lấy QR từ tham số URL hoặc tự dựng QR vào tài khoản cố định | Chỉ dùng QR/trang thanh toán do backend trả về |
| Timeout thanh toán | Timeout mạng bị ghi nhận chắc chắn là thất bại dù nhà cung cấp có thể đã tạo đơn | Ghi nhận trạng thái chưa xác định để có thể đối soát; tăng timeout frontend cho phù hợp |
| Realtime | Broadcast công khai cả tên người đóng góp và mã thanh toán | Sự kiện chung chỉ báo chiến dịch thay đổi; thông tin xác nhận đơn gửi riêng cho người đóng góp |
| Thời điểm thông báo | Gửi sự kiện trước khi transaction commit | Dùng `AfterCommit` để gửi khi dữ liệu đã được lưu thành công |
| WebSocket | Không giới hạn origin; tài khoản bị khóa hoặc token hết hạn vẫn giữ kết nối riêng | Dùng origin đã cấu hình, kiểm tra tài khoản và đóng kết nối hết hiệu lực; đồng bộ thao tác gửi trên cùng session |
| WebSocket khi chạy local/Docker | Thiếu proxy `/ws` | Thêm proxy WebSocket trong Vite và Nginx |
| Đăng nhập Microsoft | Callback chấp nhận thiếu cookie kiểm tra phiên đăng nhập | Bắt buộc state, verifier và nonce khớp với cookie của trình duyệt |
| Điều hướng sau đăng nhập | Mất URL điểm danh chứa token khi đi qua Microsoft | Lưu đường dẫn nội bộ trong `sessionStorage`, quay lại sau đăng nhập; từ chối domain ngoài |
| Nút Microsoft | Phụ thuộc cờ frontend riêng nên có thể mất nút dù backend đã cấu hình | Đọc endpoint configuration của backend và hiển thị trạng thái chưa cấu hình |
| Ảnh đề xuất/chiến dịch nháp | List và ảnh có thể được xem ngoài phạm vi quyền | Kiểm tra quyền chủ đề xuất/admin và quyền xem chiến dịch trước khi trả dữ liệu |
| Danh sách ảnh | Truy vấn tải toàn bộ byte của mọi ảnh chỉ để lấy chú thích/URL | Dùng projection metadata, chỉ lấy byte khi tải một ảnh |
| File tải lên | Tin MIME do trình duyệt gửi; hóa đơn chấp nhận SVG | Kiểm tra nội dung thật, chuẩn hóa PNG/JPEG, giới hạn dung lượng và số pixel; PDF hóa đơn chỉ tải xuống |
| Hạn mức upload | Giao diện cho phép 5 MB nhưng Spring chỉ nhận 1 MB, Nginx chỉ nhận 2 MB | Spring nhận tối đa 5 MB/tệp, request và Nginx 6 MB; avatar vẫn có kiểm tra riêng 1 MB |
| Hóa đơn | Người đăng nhập bất kỳ biết ID có thể đọc hóa đơn chưa duyệt | Hóa đơn chưa duyệt cần quyền quản lý; hóa đơn đã duyệt theo quyền xem chiến dịch |
| Link file riêng tư | Thẻ `img`/link thông thường không gửi bearer token | Thêm `ApiImage` và `AttachmentLink` để tải bằng API client đã xác thực |
| Form chiến dịch | Sửa tiêu đề cũng gửi funding = 0 và xóa sponsor/budget | Tách `planValues.ts`, giữ nguyên dữ liệu tài trợ/ngân sách từ server |
| Lưu form rồi upload lỗi | Thử lại có thể tạo thêm đề xuất/chi phí; ảnh upload lỗi bị nuốt | Ghi nhớ ID/version vừa lưu, chỉ thử lại các ảnh chưa tải thành công và hiển thị lỗi |
| Bản nháp trình duyệt | Mọi tài khoản dùng chung một key | Tách key theo ID người dùng |
| Trang chiến dịch | Truyền slug vào API yêu cầu UUID, làm lỗi kiểm tra thành viên/dashboard/gallery | Chờ detail trả về rồi dùng `campaign.id`; chỉ gọi dashboard khi có quyền |
| Hoạt động tình nguyện | SQL có `order ...` thiếu `by`, lỗi bị bỏ qua | Sửa thành `order by` và sắp xếp ổn định theo ID |
| Danh sách giải ngân | Chỉ lấy 100 chiến dịch đầu | Đọc tiếp các trang để không bỏ sót chiến dịch trong quy mô đồ án |
| Trạng thái giải ngân | Giá trị mặc định `PENDING_FUNDS` khiến trạng thái đạt mục tiêu/kết thúc không được tính lại | Tính lại trạng thái nếu chưa `PAID_OUT` |
| Xác nhận giải ngân | Có thể nhập số âm/lẻ và ghi đè giải ngân cũ | Yêu cầu số tiền nguyên dương bằng tổng donation đã xác nhận, kiểm tra trạng thái, version và không xác nhận lần hai |
| Điểm danh QR | Không kiểm tra thời gian bắt đầu và trạng thái chiến dịch | Chỉ cho điểm danh trong thời gian của buổi và khi chiến dịch còn cho phép hoạt động; cập nhật version buổi điểm danh |
| Quét đối soát nền | Luôn lấy 10 đơn mới nhất, có thể bỏ quên đơn cũ | Duyệt các trang luân phiên; giảm tần suất từ 4 xuống 15 giây |
| Query cache | Invalidate nhiều key không tồn tại và refetch trùng lặp | Dùng các nhóm key hiện có, bỏ refetch thừa; làm mới dữ liệu khi quay lại tab |
| Email nghiệp vụ | Gửi SMTP trong transaction có thể làm rollback việc duyệt tình nguyện | Gửi email duyệt/hoàn thành sau commit và trên tác vụ nền của Spring; thêm timeout SMTP |
| Thư cảm ơn | Báo đã gửi dù email bị tắt; cấp chứng nhận cho cả người chưa được xác minh hoàn thành | Kiểm tra cấu hình mail, chiến dịch đã hoàn thành; chỉ chọn tình nguyện viên có completion `VERIFIED` |
| Notification | Không giới hạn page size; tiêu đề dài hơn cột DB | Kiểm tra phân trang 1–100; giới hạn tiêu đề theo độ dài cột |
| Dependency frontend | `npm audit` phát hiện 3 dependency có cảnh báo mức high | Cập nhật Vite 8.3.8, Zod 4.6.7 và bản vá dependency gián tiếp trong lockfile |

## Các tệp nên đọc để hiểu thay đổi

- `PayOSPaymentGateway.java`: xác minh chữ ký trước khi đổi trạng thái thanh toán. Thuật toán đối chiếu với [tài liệu chính thức payOS](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/).
- `ExpenseReceiptService.java`, `CampaignGalleryController.java`: kiểm tra quyền ngay tại luồng lấy dữ liệu.
- `UploadedFiles.java`: kiểm tra file và chuẩn hóa ảnh; hiện nhận PNG/JPEG, PDF chỉ dành cho hóa đơn chi phí.
- `AfterCommit.java`: đợi dữ liệu lưu thành công rồi mới gửi sự kiện.
- `planValues.ts`: chuyển dữ liệu giữa form và API mà không làm mất thông tin tiền tài trợ.
- `returnPath.ts`: chỉ chấp nhận đường dẫn thuộc website khi quay lại sau đăng nhập.
- `ApiImage.tsx`, `AttachmentLink.tsx`: tải file có Authorization header và thu hồi object URL.

## Chạy kiểm tra

Backend cần JDK 21. Frontend cần Node >=22.12 và npm >=10.

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

```powershell
cd frontend
npm ci
npm test
npm run build
npm audit
```

Frontend dùng test runner có sẵn của Node, không thêm framework kiểm thử. Node 22 có thể in cảnh báo experimental khi chạy TypeScript trực tiếp; cảnh báo này không có nghĩa là test thất bại.

Các kiểm tra đã thực hiện được ghi ở cuối tài liệu sau khi hoàn tất.

## Cấu hình và kiểm tra thủ công khi demo

1. Khi demo không dùng tiền thật, chọn `PAYMENT_PROVIDER=mock` với profile dev. Khi dùng PayOS thật, cấu hình đủ ba khóa, không dùng khóa giả.
2. Microsoft cần redirect URI được đăng ký khớp chính xác với cấu hình backend. Khi frontend dùng reverse proxy `/api`, nên dùng callback trên cùng domain frontend, ví dụ `https://your-site/api/v1/auth/microsoft/callback`, để cookie đăng nhập thuộc đúng domain. Không tắt kiểm tra state để chữa lỗi cookie.
3. Dùng hai tài khoản: A tạo đề xuất/chi phí, B không có quyền quản lý. Kiểm tra B không đọc được ảnh đề xuất riêng và hóa đơn chưa duyệt của A.
4. Mở chiến dịch bằng slug. Người đã được duyệt tham gia cần nhìn thấy các tab điều phối phù hợp; người ngoài không được gọi dashboard riêng.
5. Sửa tiêu đề đề xuất/chiến dịch có tài trợ, kiểm tra số tiền và sponsor còn nguyên.
6. Thử upload file quá 5 MB, SVG đổi đuôi JPG, ảnh PNG/JPEG hợp lệ và PDF hóa đơn. Khi upload lỗi sau khi lưu, bấm lại không được tạo thêm bản ghi.
7. Tạo buổi điểm danh trong thời gian hiện tại; mở QR khi chưa đăng nhập, đăng nhập rồi kiểm tra URL vẫn còn token. Thử điểm danh trước/sau thời gian buổi và khi chiến dịch đã kết thúc.
8. Dùng đơn test PayOS: callback sai chữ ký không được tăng tiền; callback đúng lặp lại không cộng tiền lần hai. Kiểm tra email và thông báo sau khi dữ liệu đã lưu.
9. Kiểm tra giải ngân không nhận số âm/lẻ, không chấp nhận tổng khác số tiền đã xác nhận và không xác nhận lần hai. Đây là thao tác ghi nhận chuyển tiền; backend không tự thực hiện chuyển khoản ngân hàng.

## Giới hạn cần hiểu khi bảo vệ đồ án

- Chưa có kiểm thử end-to-end với PostgreSQL, trình duyệt, tài khoản Microsoft và giao dịch PayOS thật trong lần sửa này. Docker CLI có sẵn nhưng Docker daemon không chạy.
- Các notification/WebSocket vẫn hoạt động trong một backend instance. Email nền dùng cơ chế có sẵn của Spring, không bảo đảm retry bền vững nếu ứng dụng dừng giữa lúc gửi.
- Thư cảm ơn hàng loạt và xuất Excel vẫn xử lý trực tiếp, phù hợp bộ dữ liệu nhỏ của PBL. Nếu triển khai cho lượng người dùng lớn thì mới xem xét job queue, streaming và pagination UI giải ngân.
- Không thay đổi migration cũ hay tự chỉnh dữ liệu ngân hàng/giao dịch đã có. Nếu từng chạy phiên bản webhook cũ trên môi trường thật, nhóm cần đối chiếu lại các bản ghi PAID trước đó với nhà cung cấp.

## Kết quả kiểm tra tự động

- Backend: 19 unit test qua, không lỗi và không test bị bỏ qua; đóng gói được `dut-connect.jar` bằng JDK 21.
- Frontend: 7 test qua bằng Node test runner; TypeScript và production build qua.
- `npm audit`: 0 vulnerability tại thời điểm kiểm tra.
- `git diff --check`: không có lỗi whitespace.
- Chưa chạy kiểm tra tích hợp với PostgreSQL vì Docker daemon hiện không hoạt động; chưa kiểm tra đăng nhập Microsoft/giao dịch PayOS thật.
