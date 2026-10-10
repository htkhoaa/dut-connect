# Changelog 📋

Tất cả các thay đổi đáng chú ý của dự án **DUT Connect** sẽ được ghi lại trong tài liệu này.

Định dạng tài liệu tuân thủ theo tiêu chuẩn [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/),
và dự án áp dụng quy tắc định phiên bản ngữ nghĩa [Semantic Versioning](https://semver.org/lang/vi/).

---

## [0.2.0] - 2026-10-10

* **Tự động hóa CI/CD với GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):**
  * Xây dựng workflow kiểm thử đa tầng gồm **6 jobs** độc lập chạy tự động trên mỗi `push` và `pull_request` về nhánh `main`:
    * **Job Backend:** Cài đặt JDK 21 (Temurin), kiểm tra định dạng code (`spotless:check`), chạy toàn bộ Unit Tests (`mvn test`), kiểm tra đóng gói package (`mvn package`), tự động lưu trữ surefire test report khi có lỗi.
    * **Job Frontend:** Cài đặt Node.js 22, cài đặt dependencies (`npm ci`), kiểm tra strict type-checking và đóng gói bundle (`npm run build`).
    * **Job Security Scan:** Quét rò rỉ secret/token (`Gitleaks`), audit lỗ hổng thư viện frontend (`npm audit`), quét CVE tệp hệ thống (`Trivy`).
    * **Job Connector Test:** Kiểm thử kết nối và chữ ký HMAC-SHA256 cổng ZaloPay Sandbox, Mock Gateway, Rate Limiting filter.
    * **Job Contract/Schema Test:** Khởi tạo PostgreSQL 16 container, kiểm tra toàn vẹn API Contract DTOs, thực thi Flyway migration từ trạng thái trắng (`V1` $\rightarrow$ `V17`) và xác thực checksum (`flyway:validate`).
    * **Job Docker:** Kiểm tra cú pháp cấu hình `docker compose config`.
* **Bảo vệ tần suất yêu cầu (Rate Limiting):**
  * Thêm `InMemoryRateLimiter` cài đặt giải thuật cửa sổ trượt (Sliding Window Log) an toàn đa luồng (`ConcurrentHashMap`, `ConcurrentLinkedQueue`).
  * Thêm `RateLimitingFilter` kích hoạt mức trần 60 request/phút, bảo vệ các endpoint nhạy cảm (`/api/v1/auth/login`, `/register`, `/refresh`) chống Brute-Force & DoS.
* **Công cụ định dạng & chuẩn hóa mã nguồn tự động (Spotless Formatter & Linter):**
  * Tích hợp `spotless-maven-plugin` (phiên bản `2.44.2`) đóng vai trò tương đương `black` và `ruff` trong Python.
  * Tự động xóa import thừa (`removeUnusedImports`), chuẩn hóa thụt lề 4 khoảng trắng (`indent 4 spaces`), loại bỏ khoảng trắng cuối dòng (`trimTrailingWhitespace`) và đảm bảo ngắt dòng cuối file (`endWithNewline`).
  * Hỗ trợ hai chế độ vận hành: `mvn spotless:check` (kiểm tra chuẩn CI/CD) và `mvn spotless:apply` (tự động format toàn bộ codebase).
* **Bộ kiểm thử tự động Phase 1 (Unit Test Suite):**
  * Tích hợp `spring-boot-starter-test` và `spring-security-test` vào `backend/pom.xml`.
  * Xây dựng **64 test cases** tự động (100% PASS), chạy độc lập không phụ thuộc database ngoài:
    * `InMemoryRateLimiterTest`: Bao gồm stress test đồng thời 20 luồng (`CountDownLatch`) và kiểm tra reset cửa sổ thời gian.
    * `RateLimitingFilterTest`: Kiểm tra trả về HTTP 429 `RATE_LIMIT_EXCEEDED`, header `Retry-After: 60`, và trích xuất client IP từ `X-Forwarded-For`.
    * `CookieOriginFilterTest`: Kiểm tra chặn CSRF và bắt buộc whitelist Origin cho các request xác thực qua Cookie.
    * `RequestCorrelationFilterTest`: Kiểm tra vòng đời `X-Request-Id` và gắn ngữ cảnh SLF4J MDC trên từng request.
    * `SecurityErrorWriterTest`: Kiểm tra định dạng JSON lỗi chuẩn (`ApiError`) và tích hợp `ErrorCode`.
    * `IdentitySettingsTest`: Kiểm tra các ràng buộc biến môi trường (JWT secret $\ge 32$ bytes, TTL, Origins).
    * `ReadableSlugTest`: Kiểm tra chuẩn hóa tiêu đề và khử dấu tiếng Việt thành URL slug.
    * `RegistrationRulesTest`: Kiểm tra định dạng MSSV (10 chữ số), email `@sv.dut.udn.vn`, độ phức tạp mật khẩu.
    * `ApiExceptionHandlerTest`: Kiểm tra ánh xạ mã HTTP status, bắt lỗi trùng lặp dữ liệu (SQLState 23505) và chống rò rỉ chi tiết SQL.
* **Hệ thống Quản lý Mã lỗi Tập trung (Error Catalog):**
  * Thêm enum [`ErrorCode`](backend/src/main/java/vn/edu/dut/connect/shared/api/ErrorCode.java) chuẩn hóa tất cả mã lỗi hệ thống, loại bỏ triệt để magic string và mã trạng thái hardcoded.
* **Mở cổng PostgreSQL ra Host:**
  * Bổ sung ánh xạ port `127.0.0.1:5432:5432` cho container `postgres` trong `docker-compose.yml`, cho phép công cụ bên ngoài (DBeaver, DataGrip, psql) kết nối trực tiếp.

### 🔄 Changed (Thay đổi & Tái cấu trúc)
* **Tái cấu trúc Exception Handling ([`ApiExceptionHandler.java`](backend/src/main/java/vn/edu/dut/connect/shared/api/ApiExceptionHandler.java)):**
  * Tinh gọn logic xử lý lỗi: loại bỏ các layer trung gian không cần thiết, hợp nhất hàm tiện ích phản hồi lỗi `error` và `domainViolation`.
  * **Contextual Logging:** Phân định rõ `logClientWarning` (ghi WARN ngắn gọn cho lỗi 4xx mà không kèm stacktrace) và `logSystemError` (ghi ERROR chi tiết kèm root cause và stacktrace cho lỗi 5xx).
* **Chuẩn hóa các thành phần phát sinh lỗi Security:**
  * Nâng cấp [`SecurityErrorWriter.java`](backend/src/main/java/vn/edu/dut/connect/shared/infrastructure/security/SecurityErrorWriter.java) hỗ trợ ghi lỗi đồng bộ theo danh mục [`ErrorCode`](backend/src/main/java/vn/edu/dut/connect/shared/api/ErrorCode.java).
  * Cập nhật [`CookieOriginFilter.java`](backend/src/main/java/vn/edu/dut/connect/shared/infrastructure/security/CookieOriginFilter.java) và [`InfrastructureSecurityConfiguration.java`](backend/src/main/java/vn/edu/dut/connect/shared/infrastructure/security/InfrastructureSecurityConfiguration.java) loại bỏ magic strings (`"ACCESS_DENIED"`, `"AUTHENTICATION_REQUIRED"`, `401`, `403`).
  * Mở rộng [`ApplicationFailure.java`](backend/src/main/java/vn/edu/dut/connect/shared/application/ApplicationFailure.java) với constructor và factory methods hỗ trợ `ErrorCode`.
* **Cập nhật tài liệu kỹ thuật & README:**
  * Viết lại toàn diện [`README.md`](README.md) chuẩn hóa theo chuẩn doanh nghiệp (bảng Tech Stack chi tiết cho Backend, Frontend, DevOps, Test; cấu trúc thư mục trực quan; hướng dẫn kiểm thử).
  * Đổi tên `docs/phase-1-verification.md` $\rightarrow$ `docs/phase-1-infra.md` để phản ánh đúng phạm vi kiểm tra hạ tầng cốt lõi.

### 🛡️ Security (Bảo mật)
* **Phòng chống Brute-force & DoS:** Áp dụng sliding-window rate limit trên các route xác thực công khai.
* **Chống rò rỉ thông tin nội bộ CSDL (SQL Information Leakage):** Trích xuất mã SQLState `23505` để phân loại lỗi trùng lặp dữ liệu người dùng mà không để lộ câu lệnh SQL, tên bảng hay tên index ra phản hồi API.
* **Bảo vệ Cookie Token:** Bắt buộc khớp Origin đã đăng ký đối với các thao tác xác thực dùng refresh token cookie.

---

## [0.1.0] - 2026-10-09

### 🚀 Added
* Khởi tạo kiến trúc Monorepo: Spring Boot 3.4.3 (Java 21) Backend + React 18 / Vite / TypeScript Frontend.
* Thiết lập 17 bản Flyway migration khởi tạo toàn bộ schema cơ sở dữ liệu `dut_connect`.
* Tích hợp cổng thanh toán ZaloPay Sandbox và Mock Payment Gateway cho luồng quyên góp.
* Thiết lập Docker Compose đa dịch vụ (PostgreSQL 16, Spring Boot Backend, Nginx Frontend).
* Cơ chế xác thực phân quyền Stateless JWT kết hợp Refresh Cookie Rotation.
