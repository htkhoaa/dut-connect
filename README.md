# DUT Connect 🎓

> **Nền tảng kết nối hoạt động tình nguyện, quyên góp và điều phối chiến dịch sinh viên**  
> *Trường Đại học Bách khoa — Đại học Đà Nẵng (DUT)*

---

## 📌 1. Tổng quan dự án

**DUT Connect** là hệ thống phần mềm quản lí và điều phối các hoạt động sinh viên, chiến dịch tình nguyện và quyên góp vì cộng đồng dành cho sinh viên, câu lạc bộ và các đơn vị đoàn thể thuộc Trường Đại học Bách khoa — Đại học Đà Nẵng.

Hệ thống giải quyết bài toán quản lý phân tán bằng cách số hóa toàn diện quy trình: từ đề xuất chiến dịch, tuyển chọn tình nguyện viên, giao việc, điểm danh, công nhận giờ tình nguyện chính thức, cho đến minh bạch hóa 100% dòng tiền quyên góp và chi phí triển khai.

### ✨ Các tính năng cốt lõi

* **Định danh & Hồ sơ sinh viên:** Đăng ký sinh viên bằng mã số sinh viên (MSSV), hồ sơ năng lực cá nhân, quản lý danh mục kỹ năng, hỗ trợ đăng nhập liên kết Google OAuth.
* **Tổ chức & Câu lạc bộ (Organizations):** Quản lý hồ sơ CLB/Đội/Nhóm, quy trình duyệt tổ chức bởi Nhà trường, phân quyền quản trị nội bộ (`OWNER`, `MANAGER`, `MEMBER`).
* **Đề xuất & Vận hành Chiến dịch (Campaigns):** Đề xuất chiến dịch (`VOLUNTEER_ONLY`, `DONATION_ONLY`, `HYBRID`), phê duyệt đa cấp, theo dõi tiến độ thời gian thực.
* **Điều phối Tình nguyện viên (Volunteer Coordination):** Tuyển TNV theo 2 phân ban (Kỹ thuật & Hậu cần), giao việc theo trạng thái Kanban (`TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE` $\rightarrow$ `VERIFIED`), tạo lịch họp, điểm danh trực ca và nghiệm thu cấp chứng nhận giờ tình nguyện.
* **Minh bạch Tài chính & Quyên góp (Donations & Finance):** Tích hợp cổng thanh toán ZaloPay Sandbox và Mock Gateway, sao kê minh bạch các khoản ủng hộ và duyệt từng khoản chi tiêu có hóa đơn chứng từ.
* **Trí tuệ nhân tạo hỗ trợ (Advisory AI):** Mô-đun AI phân tích yêu cầu chiến dịch và đề xuất danh sách tình nguyện viên phù hợp nhất dựa trên hồ sơ kỹ năng.
* **Báo cáo & Thống kê:** Dashboard tổng quan số liệu và xuất báo cáo dữ liệu dạng bảng Excel (Apache POI) chuẩn mẫu cho Nhà trường.

---

## 🛠️ 2. Công nghệ sử dụng (Tech Stack)

### 🖥️ Backend (Phía máy chủ)
| Thành phần | Công nghệ / Thư viện | Phiên bản | Mục đích & Đặc tính kỹ thuật |
| :--- | :--- | :---: | :--- |
| **Ngôn ngữ** | Java | 21 (LTS) | Nền tảng thực thi chính, tính năng Virtual Threads & Pattern Matching |
| **Framework chính** | Spring Boot | 3.4.3 | Khung phát triển RESTful API & Quản lý Dependency Injection |
| **Bảo mật (Security)** | Spring Security, Nimbus JOSE | 6.x | Stateless JWT (HS256), HttpOnly Refresh Cookie Rotation, Whitelist CORS & Cookie Origin CSRF Filter |
| **Cơ sở dữ liệu** | PostgreSQL | 16-alpine | Hệ quản trị CSDL quan hệ chính (schema độc lập `dut_connect`) |
| **ORM / Data Access** | Spring Data JPA, Hibernate | 6.x | Quản trị thực thể, Open Session in View disabled, `ddl-auto=validate` |
| **Connection Pool** | HikariCP | 5.1.x | Quản lý kết nối CSDL tốc độ cao, timeout 3s, pool size tối đa 10 |
| **Migration** | Flyway | 10.x | Kiểm soát và nâng cấp phiên bản schema tự động (`V1` $\rightarrow$ `V17`) |
| **Giám sát (Monitoring)**| Spring Boot Actuator | 3.4.3 | Cung cấp Liveness & Readiness probe tại `/api/actuator/health` |
| **Truy vết (Tracing)** | SLF4J + MDC | 2.x | Gắn nhãn và truy vết theo `X-Request-Id` trên từng luồng request |
| **Rate Limiter** | In-Memory Sliding Window | Tự xây dựng | Giới hạn 60 req/phút cho các API nhạy cảm, chống Brute-Force & DDoS |
| **Báo cáo (Reporting)** | Apache POI (`poi-ooxml`) | 5.4.0 | Xuất báo cáo dữ liệu dạng bảng Excel (.xlsx) chuẩn cấu trúc |
| **Xử lý JSON** | Jackson Datatype JSR310 | 2.18.x | Serialization ngày giờ theo chuẩn UTC ISO-8601 |

### 🌐 Frontend (Giao diện người dùng)
| Thành phần | Công nghệ / Thư viện | Phiên bản | Mục đích & Đặc tính kỹ thuật |
| :--- | :--- | :---: | :--- |
| **Core Framework** | React | 18.3.x | Thư viện xây dựng giao diện người dùng theo Component-driven |
| **Ngôn ngữ** | TypeScript | 5.x | Kiểm soát kiểu dữ liệu tĩnh nghiêm ngặt (Strict Mode Compilation) |
| **Build Tool** | Vite | 5.x | Đóng gói ứng dụng, tối ưu bundling và hot module replacement (HMR) |
| **Styling** | Tailwind CSS | 3.4.x | Hệ thống thiết kế tiện ích, tối ưu hiển thị Mobile (390px), Tablet (768px), Desktop (1280px) |
| **Biểu tượng (Icons)** | Lucide React | Latest | Hệ thống icon vector giao diện người dùng hiện đại |
| **Server State** | TanStack Query (React Query)| 5.x | Quản lý cache, đồng bộ và tự động làm mới dữ liệu từ API |
| **Client State** | Zustand | 4.x | Lưu trữ trạng thái đăng nhập và Access Token trong bộ nhớ RAM |
| **Xử lý Form** | React Hook Form | 7.x | Quản lý trạng thái form hiệu năng cao, giảm thiểu re-render |
| **Validation** | Zod | 3.x | Kiểm thực dữ liệu form (schema validation) an toàn kiểu |
| **HTTP Client** | Axios | 1.7.x | Gửi request HTTP với interceptor tự động xoay vòng refresh token |

### 🐳 DevOps & Cơ sở hạ tầng
| Thành phần | Công nghệ / Nền tảng | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Container hóa** | Docker | Multi-stage build tối ưu dung lượng image và bảo mật môi trường chạy |
| **Điều phối dịch vụ** | Docker Compose | Điều phối đồng bộ 3 service cô lập: `postgres`, `backend`, `frontend` |
| **Web Server & Proxy** | Nginx (Alpine) | Phục vụ static SPA, cấu hình SPA fallback, reverse proxy `/api/` về backend |
| **Quản lý cấu hình** | Dotenv (`.env`) | Quản lý biến môi trường tập trung theo chuẩn phương pháp 12-Factor App |

### 🧪 Kiểm thử tự động (Testing)
| Thành phần | Thư viện / Công cụ | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Test Framework** | JUnit 5 (Jupiter) | Khung thực thi kiểm thử tiêu chuẩn hiện đại của Java |
| **Assertion Library** | AssertJ | Cú pháp kiểm tra kết quả rõ ràng, dễ đọc (`assertThat(...)`) |
| **Mocking** | Mockito | Giả lập hành vi cho các cổng tích hợp và dependency |
| **Security Test** | Spring Security Test | Giả lập quyền hạn người dùng (`@WithMockUser`) cho kiểm thử bảo mật |
| **Concurrency Test** | Java Concurrency (`CountDownLatch`) | Kích hoạt đa luồng đồng thời kiểm tra race-condition và khả năng chịu tải |


---

## 📁 3. Kiến trúc thư mục dự án

```text
dut-connect/
├── backend/                             # Mã nguồn Backend (Spring Boot 3.4.3)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/vn/edu/dut/connect/
│   │   │   │   ├── shared/              # Hạ tầng chung, Exception Handler, Rate Limiting, Tracing
│   │   │   │   ├── identity/            # Quản lý tài khoản, User, Profile, Auth, Google OAuth
│   │   │   │   ├── organization/        # Quản lý CLB/Tổ chức, phân quyền thành viên
│   │   │   │   ├── campaign/            # Đề xuất và vòng đời chiến dịch
│   │   │   │   ├── volunteer/           # Tuyển TNV, giao việc, họp, điểm danh, giờ công tác
│   │   │   │   ├── donation/            # Quyên góp, xử lý giao dịch thanh toán Mock/ZaloPay
│   │   │   │   ├── finance/             # Quản lý thu chi, duyệt hóa đơn chứng từ
│   │   │   │   ├── ai/                  # Dịch vụ AI phân bổ và gợi ý ứng viên
│   │   │   │   ├── dashboard/           # Tổng hợp số liệu thống kê
│   │   │   │   └── reporting/           # Xuất báo cáo Excel
│   │   │   └── resources/
│   │   │       ├── application.yml      # Cấu hình trung tâm (database, security, payment, ai, logging)
│   │   │       ├── application-dev.yml  # Cấu hình ghi đè môi trường Dev
│   │   │       ├── application-prod.yml # Cấu hình ghi đè môi trường Production
│   │   │       └── db/migration/        # 17 tệp Flyway Migration SQL
│   │   └── test/java/                   # Toàn bộ mã nguồn kiểm thử Unit Test & Stress Test
│   ├── Dockerfile                       # Multi-stage build jar trong container
│   ├── mvnw & mvnw.cmd                  # Maven Wrapper
│   └── pom.xml                          # Maven Project Object Model
│
├── frontend/                            # Mã nguồn Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/                  # Các UI Component tái sử dụng (Button, Dialog, Table...)
│   │   ├── features/                    # Các module màn hình (auth, campaigns, organizations...)
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── lib/                         # Axios client, cấu hình API
│   │   └── stores/                      # Zustand state store
│   ├── nginx/                           # Cấu hình security headers của Nginx
│   ├── nginx.conf                       # Cấu hình máy chủ web Nginx & reverse proxy
│   ├── Dockerfile                       # Multi-stage build static assets chạy trên Nginx
│   └── package.json                     # Node.js dependencies
│
├── docs/                                # Toàn bộ hồ sơ kiểm thử & tài liệu dự án
│
├── scripts/                             # Script tiện ích nạp dữ liệu mẫu
│   └── seed-demo.mjs                    # Khởi tạo dữ liệu sinh viên, CLB, chiến dịch mẫu
│
├── .env.example                         # File mẫu cấu hình biến môi trường
├── docker-compose.yml                   # Tệp chạy Docker mặc định
├── docker-compose.dev.yml               # Tệp override mở cổng 5432 và 8081 khi dev local
└── spec.md                              # Đặc tả kỹ thuật chi tiết của hệ thống
```

---

## ⚙️ 4. Quản lý cấu hình (Configuration Management)

Cấu hình dự án được tổ chức tinh gọn, chuẩn mực theo Spring Boot profiles tại thư mục [`backend/src/main/resources/`](backend/src/main/resources):

```text
backend/src/main/resources/
├── application.yml        # Cấu hình trung tâm: Kết nối PostgreSQL, JWT, Whitelist CORS, ZaloPay, AI gợi ý TNV
├── application-dev.yml    # Ghi đè cấu hình cho môi trường Dev (mật khẩu mặc định, hiển thị demo catalog)
├── application-prod.yml   # Ghi đè cấu hình cho môi trường Production (tắt log SQL, bảo mật cao)
└── db/migration/          # 17 bản Flyway Migration quản lý schema cơ sở dữ liệu
```

---

## 🚀 5. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết (Prerequisites)
* **Docker & Docker Compose** (khuyên dùng Docker Desktop phiên bản mới nhất).
* *(Tùy chọn nếu chạy ngoài host)*: **Java 21**, **Node.js 22.x**, **PostgreSQL 16**.

---

### Cách 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)

1. **Chuẩn bị file môi trường `.env`:**
   ```powershell
   Copy-Item .env.example .env
   ```
   *(Đảm bảo `APP_JWT_SECRET` trong file `.env` là một chuỗi ngẫu nhiên có ít nhất 32 ký tự UTF-8).*

2. **Khởi chạy hệ thống:**
   ```powershell
   docker compose up -d --build
   ```

3. **Truy cập ứng dụng:**
   * **Giao diện Web:** [http://localhost](http://localhost) (cổng 80)
   * **Health Check API:** [http://localhost/healthz](http://localhost/healthz)
   * **Actuator Health:** [http://localhost/api/actuator/health](http://localhost/api/actuator/health)
   * **Database PostgreSQL:** `localhost:5432` (`username: dut_connect`, `db: dut_connect`)

4. **Dừng hệ thống:**
   ```powershell
   docker compose down
   ```
   *(Dữ liệu database được lưu bền vững trong Docker volume `postgres_data`).*

---

### Cách 2: Khởi chạy cho Lập trình viên (Local Development)

1. **Bật riêng Database trong Docker:**
   ```powershell
   docker compose up -d postgres
   ```

2. **Khởi chạy Backend (Spring Boot):**
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
   *(Backend khởi động tại cổng 8080).*

3. **Khởi chạy Frontend (Vite Dev Server):**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   *(Mở trình duyệt tại [http://localhost:5173](http://localhost:5173), request `/api` sẽ tự động proxy vào backend).*

---

## 📊 6. Dữ liệu mẫu (Demo Data Seeding)

Sau khi hệ thống đã khởi chạy, bạn có thể nạp bộ dữ liệu mẫu mang đặc trưng sinh viên Bách khoa Đà Nẵng:

```powershell
node scripts/seed-demo.mjs
```

Script sẽ tự động:
* Tạo 6 tài khoản sinh viên với các vai trò (`organizer`, `technical`, `logistics`, `donor`, `applicant`, `manager`).
* Tạo 6 câu lạc bộ/đoàn thể sinh viên DUT đã được phê duyệt.
* Tạo 8 chiến dịch tình nguyện thuộc nhiều lĩnh vực khác nhau kèm nhiệm vụ, lịch họp, đơn đăng ký và lịch sử giao dịch ủng hộ mẫu.
* Thông tin tài khoản đăng nhập demo được lưu tự động tại `.local/demo-accounts.json`.

---

## 🧪 7. Kiểm thử tự động & Chuẩn hóa mã nguồn (Testing & Code Quality)

### 7.1. Chạy bộ kiểm thử tự động (Unit Test Suite)
Dự án trang bị bộ kiểm thử tự động toàn diện cho các thành phần hạ tầng cốt lõi, bảo mật và chịu tải:

```powershell
cd backend
.\mvnw.cmd test
```

### 7.2. Kiểm tra & Tự động định dạng mã nguồn (Spotless - Tương đương Black/Ruff)
Dự án tích hợp **Spotless** tự động chuẩn hóa thụt lề 4 spaces, xóa import thừa (unused imports), chuẩn hóa khoảng trắng và ngắt dòng:

```powershell
# Kiểm tra định dạng mã nguồn (tương đương black --check / ruff check)
.\mvnw.cmd spotless:check

# Tự động sửa và định dạng toàn bộ mã nguồn (tương đương black . / ruff --fix)
.\mvnw.cmd spotless:apply
```

### 7.3. Đường ống tích hợp liên tục (GitHub Actions CI)
Quy trình CI tự động ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) được kích hoạt trên mọi `push` và `pull_request` về nhánh `main` gồm 6 jobs chuyên biệt:
* **Backend Build & Test:** Kiểm tra formatting `spotless:check`, thực thi 64 unit tests `mvn test`, xác thực đóng gói `mvn package`.
* **Frontend Typecheck & Bundle:** Cài đặt dependencies `npm ci`, kiểm tra nghiêm ngặt kiểu dữ liệu TypeScript & đóng gói Vite bundle (`npm run build`).
* **Security & Vulnerability Scan:** Quét rò rỉ secret/token (`Gitleaks`), audit lỗ hổng package frontend (`npm audit`), rà soát CVEs tệp hệ thống (`Trivy`).
* **Connector & Gateway Test:** Kiểm thử tích hợp kết nối và xác thực chữ ký HMAC-SHA256 cổng ZaloPay Sandbox, Mock Gateway, Rate Limiting filter.
* **Contract & Schema Verification:** Chạy PostgreSQL 16 container, xác thực DTO/API contracts và thực thi Flyway migration từ đầu (`V1` $\rightarrow$ `V17`), kiểm tra checksum schema (`flyway:validate`).
* **Docker Lint:** Kiểm tra tính toàn vẹn cú pháp cấu hình `docker compose config`.

---

## 📚 8. Tài liệu tham khảo liên quan

* [CHANGELOG.md](CHANGELOG.md): Nhật ký thay đổi và lịch sử nâng cấp phiên bản hệ thống.
* [docs/phase-1-infra.md](docs/phase-1-infra.md): Biên bản nghiệm thu cơ sở hạ tầng Phase 1.
* [docs/manual-smoke-checklist.md](docs/manual-smoke-checklist.md): Bảng 30 tiêu chí kiểm thử thủ công tích hợp từ đầu đến cuối hệ thống.
* [docs/ui-redesign-verification.md](docs/ui-redesign-verification.md): Báo cáo nghiệm thu giao diện Tailwind CSS và hình ảnh khuôn viên DUT.
* [docs/github-vercel.md](docs/github-vercel.md): Hướng dẫn đẩy mã nguồn lên GitHub và triển khai frontend.
* [spec.md](spec.md): Tài liệu đặc tả kỹ thuật và yêu cầu nghiệp vụ toàn diện của dự án.

---

*DUT Connect — Đồng hành cùng phong trào thanh niên tình nguyện Bách khoa Đà Nẵng.*
