# DUT Connect

Đồ án PBL của nhóm sinh viên: quản lý chiến dịch tình nguyện, kết nối tổ chức và tiếp nhận quyên góp cho cộng đồng sinh viên Trường Đại học Bách khoa – Đại học Đà Nẵng.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Dữ liệu và form | React Query, Axios, React Hook Form, Zod, Zustand |
| Backend | Java 21, Spring Boot 3.4, Spring Security, JPA/JDBC |
| Database | PostgreSQL, Flyway |
| Công cụ chạy | Maven Wrapper, npm, Docker Compose |
| Triển khai hiện tại | Frontend Vercel, backend Render |

Yêu cầu khi chạy trực tiếp: Java 21, Node.js từ 22.12, npm từ 10 và PostgreSQL. Có thể dùng Docker Desktop thay cho việc cài từng dịch vụ.

## Chức năng chính

- Đăng ký, đăng nhập bằng tài khoản sinh viên; Microsoft DUT hoặc các phương thức đăng nhập khác hoạt động khi đã cấu hình tương ứng.
- Hồ sơ, ảnh đại diện, kỹ năng, lịch sử tham gia và số giờ tình nguyện được xác minh.
- Tổ chức: tạo hồ sơ, quản lý thành viên, phân quyền đại diện và xác minh tổ chức.
- Đề xuất chiến dịch: tạo, lưu nháp, gửi xét duyệt, bổ sung nội dung hoặc hủy theo trạng thái cho phép.
- Chiến dịch: xem nội dung, đăng ký tình nguyện, quản lý đội, nhiệm vụ, lịch họp, điểm danh và xác minh hoàn thành.
- Quyên góp: tạo giao dịch, theo dõi thanh toán, tiến độ gây quỹ, chi phí công khai và giải ngân.
- Dashboard, báo cáo, xuất tài liệu, poster kết quả, thông báo và lời cảm ơn sau chiến dịch.
- Giao diện tiếng Việt/Anh; hướng dẫn tham gia và trang tập hợp chức năng cá nhân.

### Vai trò và các quy tắc cần nhớ

| Vai trò | Trách nhiệm |
|---|---|
| Khách | Xem chiến dịch, tổ chức đã xác minh và nội dung công khai |
| Sinh viên | Quản lý hồ sơ, đăng ký, quyên góp và theo dõi công việc của mình |
| Chủ sở hữu/người quản lý tổ chức | Đại diện tổ chức theo quyền được cấp |
| Người đề xuất/quản lý chiến dịch | Điều phối chiến dịch và các thành viên theo quyền của chiến dịch |
| Quản trị hệ thống | Xét duyệt đề xuất, xác minh tổ chức, quản lý người dùng, chi phí, danh mục và giải ngân |

- Tổ chức phải được xác minh; người tạo đề xuất phải có quyền đại diện. Quyền admin không tự động thay thế tư cách đại diện tổ chức.
- Đề xuất được duyệt tạo chiến dịch và cấp quyền quản lý cho người đề xuất. Nội dung và trạng thái tuân theo kiểm tra của backend.
- Các trạng thái chiến dịch: `DRAFT`, `OPEN`, `ACTIVE`, `COMPLETED`, `CANCELLED`. Không thực hiện thao tác điều phối nếu trạng thái không cho phép.
- Chỉ quyên góp `PAID` được tính vào gây quỹ; chi phí công khai là chi phí đã duyệt. Không lấy kết quả trên giao diện làm bằng chứng thanh toán.
- Chỉ người tham gia đủ điều kiện mới được xác minh hoàn thành. Mã QR chỉ dùng trong thời hạn và theo quyền điểm danh.
- Các cập nhật có trường `version` dùng để phát hiện dữ liệu đã bị người khác thay đổi; cần tải lại khi có xung đột.

## Chạy nhanh bằng Docker

Tại thư mục gốc, tạo cấu hình từ mẫu:

```powershell
Copy-Item .env.example .env
```

Sửa `.env` trước khi chạy:

- Đặt `APP_JWT_SECRET` là chuỗi ngẫu nhiên ít nhất 32 byte; không dùng giá trị mẫu.
- Đặt mật khẩu database phù hợp. Khi dùng Docker Compose, host database là `postgres`.
- Nếu cần tạo admin lần đầu: bật `APP_BOOTSTRAP_ADMIN_ENABLED`, điền thông tin và mật khẩu admin riêng; tắt lại sau khi tạo xong.
- Chọn `PAYMENT_PROVIDER=mock` cho demo local không thanh toán thật.

Khởi động:

```sh
docker compose up -d --build
```

- Website: `http://localhost` hoặc cổng `FRONTEND_PORT` đã đặt.
- Xem log: `docker compose logs -f backend`.
- Dừng: `docker compose down`. Database được giữ trong volume `postgres_data`.

Để mở cổng phục vụ phát triển và xem email local bằng Mailpit:

```sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Backend được mở tại `http://localhost:8081`, PostgreSQL tại `localhost:5432`, Mailpit tại `http://localhost:8025`. Mailpit giữ thư demo ở máy local, không gửi thư đến Outlook thật.

## Chạy frontend để phát triển

Từ thư mục gốc:

```sh
npm --prefix frontend ci
```

Sao chép `frontend/.env.example` thành `frontend/.env.local`, kiểm tra:

```text
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_PROXY_TARGET=http://localhost:8081
```

Sau khi backend đang chạy:

```sh
npm --prefix frontend run dev
```

Mở `http://localhost:5173`. Nếu backend chạy cổng khác, đổi `VITE_BACKEND_PROXY_TARGET` tương ứng.

## Chạy backend trực tiếp

Chuẩn bị PostgreSQL và truyền các biến môi trường backend từ cấu hình của bạn. Maven chạy trực tiếp không tự nạp file `.env` của Docker Compose.

Các biến tối thiểu: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `APP_JWT_SECRET`. URL JDBC dùng host/cổng database thật, ví dụ `jdbc:postgresql://localhost:5432/dut_connect`. Đặt `SERVER_PORT=8081` nếu dùng cấu hình proxy frontend mẫu.

Trong thư mục `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

Linux/macOS dùng `./mvnw spring-boot:run`.

Flyway tạo/cập nhật schema `dut_connect` khi backend khởi động. Không sửa migration đã áp dụng. Endpoint readiness: `/api/actuator/health/readiness`.

## Cấu hình các tích hợp

Các tên biến và giá trị mẫu đầy đủ nằm trong `.env.example` và `frontend/.env.example`. Không commit file cấu hình chứa thông tin thật.

| Nhóm | Các biến chính |
|---|---|
| Database | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` |
| JWT và CORS | `APP_JWT_SECRET`, `APP_ALLOWED_ORIGINS`, thời hạn access/refresh token |
| Admin ban đầu | `APP_BOOTSTRAP_ADMIN_*` |
| Microsoft DUT | `MICROSOFT_ENABLED`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI` |
| Thanh toán | `PAYMENT_PROVIDER`, `PAYOS_*` hoặc `ZALOPAY_*` |
| Email | `APP_MAIL_ENABLED`, `APP_MAIL_FROM`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, cấu hình SMTP AUTH/STARTTLS |
| AI tùy chọn | `AI_ENABLED`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` |
| Danh mục mẫu DUT | `APP_DUT_CATALOGUE_ENABLED` |

Chỉ đặt biến công khai `VITE_*` ở frontend. Thông tin database, JWT, thanh toán, email và OAuth secret nằm ở môi trường backend. Access token giữ trong bộ nhớ; refresh token dùng cookie HttpOnly và có cơ chế xoay token.

### Trạng thái gửi thư cảm ơn

Giữ nguyên logic hiện tại, chờ cấu hình dịch vụ gửi thư thật:

- Chỉ gửi sau khi chiến dịch hoàn thành và người thao tác đủ quyền.
- Người nhận là email tài khoản đã quyên góp thành công hoặc tình nguyện viên đã xác minh hoàn thành. Email Outlook là địa chỉ nhận; đăng nhập website không cấp quyền gửi từ hộp thư đó.
- Giao diện hiển thị kết quả từng người nhận. Database lưu `SENDING`, `SENT`, `FAILED`; không gửi lại thư đã thành công hoặc chưa xác định xong kết quả.
- Dịch vụ tiếp nhận thư không đồng nghĩa thư chắc chắn nằm trong inbox. Người nhận cần xem cả thư rác.
- Email production chưa được xác nhận gửi thành công; cần tài khoản có quyền quản lý backend để kiểm tra cấu hình/log. Không tự tạo dịch vụ hoặc nâng gói trả phí.
- Render Free có giới hạn cổng SMTP; kiểm tra [tài liệu Render](https://render.com/docs/free) trước khi chọn cách gửi. Cấu hình xác thực phải theo nhà cung cấp hộp thư.

### Dữ liệu mẫu

Nội dung danh mục DUT nằm trong `backend/src/main/resources/catalogue/dut-catalogue.json`; script xây dựng dữ liệu ở `scripts/`. Các lịch mô phỏng có nhãn riêng, không phải thông báo tuyển chính thức của nhà trường. Bộ import cần admin đang hoạt động và không tạo người quyên góp, thanh toán hay giờ tình nguyện giả. Tắt các lần import tiếp theo bằng `APP_DUT_CATALOGUE_ENABLED=false`.

## Cấu trúc code

```text
frontend/src/
  app/                     Router, layout và các trang tổng quát
  features/<chuc-nang>/     Trang, API, hook, kiểu dữ liệu và component theo chức năng
  shared/api/              HTTP client và xử lý lỗi chung
  shared/components/       Thành phần giao diện dùng chung
  shared/hooks/            Hook dùng chung
  shared/lib/              Dịch, định dạng và tiện ích xuất tài liệu

backend/src/main/java/vn/edu/dut/connect/
  <chuc-nang>/api/                        Controller nhận/trả HTTP
  <chuc-nang>/application/                Service, DTO/contract, repository interface
  <chuc-nang>/domain/                     Entity, enum và quy tắc dữ liệu
  <chuc-nang>/infrastructure/persistence/ JPA/JDBC và triển khai repository
  shared/                                Thành phần thật sự dùng chung

backend/src/main/resources/db/migration/  Migration database
scripts/                                 Script hỗ trợ dự án
```

Luồng backend: Controller → Service → Repository → Database. Frontend dùng `api.ts` để gọi HTTP, `hooks.ts` để kết nối React Query, `types.ts` để khai báo kiểu và component để hiển thị.

Ví dụ: `PlanForm` điều phối state/lưu dữ liệu; `planSchema` kiểm tra dữ liệu; `PlanImages` hiển thị ảnh; `PlanReview` hiển thị bước kiểm tra. Mỗi tab điều phối chiến dịch có file riêng. Luồng email tách service, repository và HTML template nhưng giữ nguyên cách hoạt động.

Quy ước của nhóm:

1. Đặt tên rõ nghĩa, một hàm làm một nhiệm vụ chính; không nén nhiều câu lệnh trên một dòng.
2. Dùng kiểu dữ liệu cụ thể, tránh `any` và ép kiểu không cần thiết.
3. Tách phần có trách nhiệm riêng; không tạo thêm framework hoặc nhiều lớp trung gian cho một việc đơn giản.
4. State của một màn hình để tại màn hình; chỉ dùng store cho trạng thái thật sự chung.
5. Giữ query key, API contract, quy tắc quyền, giao diện và nội dung dịch khi chỉ refactor.
6. Thay đổi nghiệp vụ phải tách riêng với việc định dạng/làm sạch code.

## Định dạng và build

`.editorconfig`, `.prettierrc.json` và `.gitattributes` thống nhất thụt dòng/xuống dòng giữa các máy. Công cụ định dạng là tùy chọn cho phát triển, không nằm trong dependency chạy ứng dụng.

Cài công cụ một lần tại thư mục gốc:

```sh
npm install --prefix .local/code-cleanup-tools --no-audit --no-fund prettier@3.10.1 prettier-plugin-java@2.12.0
```

```sh
node scripts/format-code.mjs --check
node scripts/format-code.mjs --write
npm --prefix frontend run build
```

Build backend trong thư mục `backend`:

```powershell
.\mvnw.cmd -Dmaven.test.skip=true package
```

Bản JAR nằm ở `backend/target/dut-connect.jar`. Lệnh trên bỏ qua test; build thành công là kiểm tra biên dịch/đóng gói, không chứng minh mọi luồng nghiệp vụ đã chạy đúng.

Đợt làm sạch code giữ nguyên 1.052 mục dịch; đối chiếu tĩnh nhãn giao diện, class CSS, template, câu SQL và khai báo endpoint với bản trước. Không đổi cấu hình gửi thư, thanh toán hoặc thêm dịch vụ.

## Triển khai hiện tại

- Website: [dutconnect.vercel.app](https://dutconnect.vercel.app).
- Backend: `https://dut-connect.onrender.com`.
- Vercel dùng thư mục gốc dự án frontend là `frontend`; build `npm run build`, output `dist`.
- `frontend/vercel.json` chuyển `/api/*` sang backend trước khi trả SPA. Giữ `VITE_API_BASE_URL=/api/v1` hoặc dùng giá trị mặc định.
- Backend production dùng profile `prod`, `APP_ALLOWED_ORIGINS=https://dutconnect.vercel.app` và các biến riêng của môi trường triển khai.
- Microsoft callback đi qua cùng domain frontend: `https://dutconnect.vercel.app/api/v1/auth/microsoft/callback`.
- Có mã nguồn GitHub không đồng nghĩa có quyền quản lý Render. Thay đổi môi trường backend cần chủ tài khoản dịch vụ; không tự nâng gói hoặc tạo tài nguyên có phí.

## Nguồn ảnh và nội dung

### Ảnh Bách khoa Đà Nẵng

Không sử dụng ảnh do AI tạo. Các ảnh PNG/WebP tạo trước đó đã được loại khỏi thư mục public. Ảnh hiện tại giữ nguyên nội dung tệp gốc, không dùng AI sửa hoặc tái tạo.

| Tệp dùng trong UI | Nguồn |
| --- | --- |
| [dut-campus-garden.jpeg](frontend/public/images/dut-campus-garden.jpeg) | Người dùng cung cấp: image/3-2-1024x576.jpeg — khuôn viên cây xanh và hồ nước |
| [dut-campus-main.jpg](frontend/public/images/dut-campus-main.jpg) | Người dùng cung cấp: image/bf38ab0257844b2aa76db2b93d9bae10.jpg — tòa nhà trung tâm |
| [dut-campus-classrooms.jpg](frontend/public/images/dut-campus-classrooms.jpg) | Người dùng cung cấp: image/co-so-vat-chat-dai-hoc-bach-khoa-da-nang-2.jpg — giảng đường; giữ nguyên dấu nguồn trên ảnh |
| [dut-campus-tower.jpg](frontend/public/images/dut-campus-tower.jpg) | Người dùng cung cấp: image/dut_background-750x465.jpg — tòa nhà Bách khoa |
| [dut-students-welcome.jpg](frontend/public/images/dut-students-welcome.jpg) | Website DUT: [Ngày hội BK START](https://dut.udn.vn/TrangSinhvien/Tintuc/id/12281), [tệp ảnh gốc](https://dut.udn.vn/Files/admin/images/Tin_tuc/Sinhvien/2026/BK_START/image002.jpg) |
| [dut-students-technology.jpg](frontend/public/images/dut-students-technology.jpg) | Website DUT: [Giao lưu công nghệ DUT và Đại học Quốc gia Yokohama](https://dut.udn.vn/TrangSinhvien/Tintuc/id/12255), [tệp ảnh gốc](https://dut.udn.vn/Files/admin/images/Tin_tuc/Sinhvien/2026/Yokohama/image002.jpg) |

Tải ảnh website DUT ngày 03/10/2026. Quyền tác giả thuộc chủ sở hữu nguồn ảnh, không được tuyên bố là ảnh do dự án tạo. Nguồn bài viết được lưu cùng nội dung hoạt động và liên kết chi tiết. Ảnh hoạt động là tư liệu của trường, không phải bằng chứng rằng từng chiến dịch demo đã diễn ra. Dữ liệu chiến dịch/tổ chức mẫu vẫn được đánh dấu riêng.

Ảnh được lưu nội bộ để UI không phụ thuộc hotlink hoặc tải từ website khác khi chạy. CSS dùng object-fit/background-size để bố trí ảnh, lớp phủ sáng giúp giữ độ tương phản của nội dung. SVG favicon và icon giao diện là vector của sản phẩm.

### Các ảnh bổ sung

- dut-logo-51.png: ảnh logo kỷ niệm 51 năm do chủ dự án cung cấp; giữ nguyên tệp gốc.
- dut-volunteer-summer.jpg: [Mùa hè xanh 2025](https://dut.udn.vn/KhoaHoa/Tintuc/id/11414), ảnh gốc https://dut.udn.vn/Files/admin/images/Tin_tuc/DoanThanhnien/2025/MHX/image004.jpg.
- dut-volunteer-spring.jpg: [Ra quân Xuân tình nguyện 2026](https://dut.udn.vn/Fast/Tintuc/id/11702), ảnh gốc https://dut.udn.vn/Files/admin/images/Tin_tuc/DoanThanhnien/2026/XuanTinhnguyen/image002.jpg.
- dut-volunteer-beach.jpg: [Chủ nhật xanh tại biển Nguyễn Tất Thành](https://dut.udn.vn/KhoaNhietDL/Tintuc/id/11881), ảnh đầu tiên trong bài.
- dut-volunteer-blood.jpg: [Hiến máu đợt 2 năm 2021](https://dut.udn.vn/hoidongtruong/Tintuc/id/6213), ảnh gốc https://dut.udn.vn/Files/admin/images/Tin_tuc/DoanThanhnien/2021/HienmauND2/image005.jpg.

Hai bài Khoa Môi trường [Chủ nhật xanh](https://dut.udn.vn/KhoaCNTT/Tintuc/id/11824) và [Hướng nghiệp](https://dut.udn.vn/Tuyensinh2020/Tintuc/id/11809) nhúng ảnh Facebook trả HTTP 403 khi tải. Card dùng ảnh campus do chủ dự án cung cấp, không giả định đó là ảnh chụp sự kiện. Không tạo/sửa ảnh bằng AI. Nguồn và quyền tác giả được giữ trong tài liệu; chú thích ảnh trên giao diện đã gỡ theo yêu cầu.
