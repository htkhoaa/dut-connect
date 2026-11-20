# Đối chiếu định hướng giao diện DUT Connect

Nguồn: `DinhHuongGiaoDien.pdf`, đã đọc cả 26 trang PDF (số trang in trên slide là 2–27). Tài liệu trình bày các mô hình và mẫu thiết kế điều hướng để lựa chọn theo ngữ cảnh, không yêu cầu ghép mọi mô hình vào mọi trang. Phần bài tập cuối tài liệu là nội dung tham khảo, không phải một yêu cầu thêm chức năng MS Word vào sản phẩm.

Phạm vi cập nhật: website máy tính. Giữ cấu trúc nghiệp vụ và API hiện có. Form theo bước chỉ bật từ 1024 px; không thiết kế lại giao diện điện thoại.

| Định hướng trong PDF | Cách thể hiện trong website | Vị trí |
|---|---|---|
| Signposts – biển chỉ đường | Tiêu đề tab trình duyệt theo tiêu đề trang, breadcrumb, menu được đánh dấu, bước hiện tại | Toàn bộ các nhóm trang chính |
| Wayfinding – tìm đường | Nhãn tác vụ cụ thể, gom việc cá nhân/tham gia/quản lý; thêm các lối vào còn thiếu tới nhiệm vụ, lịch họp, điểm danh | `/me`, không gian quản lý chiến dịch |
| Giảm chi phí định hướng | Thanh menu desktop rút gọn về các điểm vào chính; trang hướng dẫn chia theo ba mục tiêu, không bắt người dùng tìm trong menu nhiều tầng | Header, `/guide` |
| Global Navigation | Logo về trang chủ; menu Chiến dịch, Tổ chức, Không gian của tôi hoặc Quản trị; footer có trợ giúp | Khung trang chung |
| Clear Entry Points | Tập trung tác vụ khám phá chiến dịch, tham gia/quyên góp và tạo đề xuất; có đường dẫn hướng dẫn trên trang chủ | `/`, `/guide`, `/me` |
| Menu Page | Một trang tập hợp liên kết kèm mô tả, chia ba nhóm: tham gia và đóng góp, tổ chức hoạt động, tài khoản và trợ giúp | `/me` |
| Hub and Spoke | Áp dụng ý tưởng trang trung tâm `/me` và trang quản lý từng chiến dịch dẫn tới các tác vụ con. Người dùng có thể quay về bằng breadcrumb | `/me`, `/manage/campaigns/:id` |
| Multi-Level | Phân cấp trang chủ → nhóm chức năng → chiến dịch → tác vụ; breadcrumb đi đúng trang cha và không hiển thị UUID làm tên trang | Các trang cá nhân, tổ chức, đề xuất, quản trị, quản lý chiến dịch |
| Stepwise | Tạo đề xuất trên desktop theo bốn bước: nội dung → thời gian/nguồn lực → hình ảnh → kiểm tra/gửi. Kiểm tra trường của bước trước khi chuyển tiếp, giữ dữ liệu khi quay lại | `/proposals/new` |
| Sequence Map | Thanh bốn bước đánh số, đánh dấu bước hiện tại bằng `aria-current="step"`; chỉ gửi ở bước cuối | `/proposals/new` |
| Pyramid | Bước kiểm tra tập trung thông tin đã nhập, có lối quay lại sửa nội dung hoặc nguồn lực rồi tiếp tục theo thứ tự | Bước cuối của `/proposals/new` |
| Breadcrumbs | Liên kết tới các cấp cha; trang hiện tại được đánh dấu bằng `aria-current="page"` | Các trang danh sách/chi tiết và tác vụ chính |
| Annotated Scrollbar | Dùng biến thể phù hợp với web: mục lục bám khi cuộn, đánh dấu mục đang đọc và thanh tiến độ cuộn; không thay thanh cuộn gốc của trình duyệt | Chi tiết chiến dịch trên desktop |
| Pan-and-Zoom | Xem ảnh bìa hoặc ảnh thư viện trong hộp thoại; phóng 100–300%, thu nhỏ, vừa khung, cuộn ngang/dọc để di chuyển | Chi tiết chiến dịch và thư viện ảnh |
| Flat Navigation | Giữ ngữ cảnh chiến dịch khi chuyển phần mô tả, đội, họp, nhiệm vụ và điểm danh bằng các tab sẵn có | Chi tiết chiến dịch của người đủ quyền |
| Modal Panel | Hộp thoại native tách tác vụ cần tập trung, quản lý focus và khóa nền; thêm nút đóng rõ ràng, khóa đóng khi đang xử lý | Hộp thoại dùng chung, xem ảnh, xác nhận |
| Escape Hatch | Nút đóng và Esc trong hộp thoại; quay lại danh sách trong form; logo/breadcrumb về vùng an toàn | Hộp thoại, form đề xuất, khung trang |
| Fat Menus | Menu tài khoản là danh sách liên kết phụ; bổ sung điểm vào Không gian của tôi và Hướng dẫn, không nhân thêm các menu nhiều tầng | Menu tài khoản hiện có |
| Fully Connected | Không tạo mạng liên kết giữa mọi trang vì số lượng tác vụ lớn; dùng menu chung và liên kết trong từng nhóm. Đây không phải mô hình fully connected thuần túy | Quyết định thiết kế |

Hub and Spoke và Pyramid ở đây là cách vận dụng vào từng khu vực, không phải cấu trúc duy nhất của toàn hệ thống. Website tổng thể vẫn tổ chức theo Multi-Level. Mục lục cuộn là biến thể của Annotated Scrollbar, không được mô tả như đã tùy biến scrollbar gốc.

## Ba luồng người dùng chính

1. Tham gia: Chiến dịch → chọn chiến dịch → đăng ký → theo dõi trong Đăng ký của tôi → nhiệm vụ/lịch họp/điểm danh khi được chấp nhận.
2. Quyên góp: Chiến dịch → chọn chiến dịch nhận đóng góp → thanh toán → xem Quyên góp của tôi và chi phí công khai. Chỉ thanh toán thành công mới được tính vào gây quỹ.
3. Tổ chức: Không gian của tôi → Tạo đề xuất → bốn bước → theo dõi xét duyệt → Chiến dịch tôi quản lý.

Chi phí điều hướng được giảm bằng các điểm vào và liên kết trực tiếp. Đây là nhận định thiết kế; chưa đo thời gian với người dùng thật nên không đưa số giây hoặc tỷ lệ cải thiện giả định.

## Phân biệt với phần email

PDF không mô tả gửi email Outlook. Phần sửa gửi thư đang được giữ riêng trên nhánh `codex/outlook-thank-you-fix`, chưa coi là đã gửi thư thành công. Các cập nhật điều hướng nằm trên `codex/pdf-navigation-update`.
