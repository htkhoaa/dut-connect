# Chuẩn bị GitHub và Vercel

## Những gì được đưa lên GitHub

Giữ source backend/frontend, migrations, Maven Wrapper, `package-lock.json`, Dockerfile/Compose, `spec.md`, tài liệu và ảnh thật trong `frontend/public/images`. Các tệp `.env.example` chỉ chứa ví dụ, được giữ để hướng dẫn cấu hình.

`.gitignore` loại `.env` và các biến thể ở mọi cấp thư mục (trừ `.env.example`), `.local` (tài khoản demo/danh sách ID), `.verification` (ảnh chụp kiểm tra, log, dữ liệu và profile trình duyệt), thông tin tài khoản Vercel/AWS/SSH, khóa riêng/chứng chỉ, IDE, dependencies, cache, thư mục build, tệp `.class` và bản sao lưu. Không bỏ qua migrations `.sql` hoặc ảnh dùng trong giao diện.

Với thư mục source chưa có `.git`, từ thư mục gốc dự án, sau khi tạo repository GitHub trống:

```powershell
git init
git branch -M main
git add .
git diff --cached --stat
git status --short
git commit -m "Prepare DUT Connect source for deployment"
git remote add origin https://github.com/<USERNAME>/<REPOSITORY>.git
git push -u origin main
```

Thay `<USERNAME>` và `<REPOSITORY>` bằng thông tin của bạn. Kiểm tra danh sách staged trước commit; `.env`, `.local`, `.verification`, `node_modules` và `target` không được xuất hiện. `.gitignore` không gỡ tệp đã được Git theo dõi trong một repository khác; nếu tệp nhạy cảm đã có trong lịch sử, cần xử lý lịch sử và đổi khóa tương ứng.

## Cấu hình frontend trên Vercel

Import repository GitHub, chọn:

| Cài đặt | Giá trị |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22.x, bản đáp ứng `>=22.12.0` |

`frontend/vercel.json` đã khai báo build và rewrite SPA để tải lại các đường dẫn như `/campaigns/...` không bị 404. Hướng dẫn chính thức: [Vite trên Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Backend Java 21/Spring Boot và PostgreSQL phải được triển khai riêng. Cấu hình hiện tại không chuyển Docker Compose/backend Java thành một backend Vercel.

## API và phiên đăng nhập: cần chọn domain trước khi deploy

Frontend dùng `VITE_API_BASE_URL` ở thời điểm build. Cookie refresh hiện là HttpOnly, `SameSite=Lax`, đường dẫn `/api/v1/auth`, và Secure khi backend bật `prod`. Không thể chỉ đặt API ở domain khác hoàn toàn rồi mong refresh cookie hoạt động.

Chọn một trong hai cách:

1. **Hai subdomain cùng domain của bạn:** ví dụ frontend `https://app.tenmiencuaban.com`, backend `https://api.tenmiencuaban.com`. Trên Vercel đặt `VITE_API_BASE_URL=https://api.tenmiencuaban.com/api/v1`; backend đặt `APP_ALLOWED_ORIGINS=https://app.tenmiencuaban.com`, bật `SPRING_PROFILES_ACTIVE=prod`. Cả hai phải HTTPS. Preview `*.vercel.app` không cùng site với API này; cần cấu hình riêng nếu muốn đăng nhập trên preview.
2. **Proxy API dưới domain frontend:** giữ `VITE_API_BASE_URL=/api/v1`, bổ sung rewrite `/api/:path*` tới backend HTTPS thật **trước** rewrite SPA trong `frontend/vercel.json`. Backend phải cho phép Origin frontend và proxy phải chuyển tiếp `Set-Cookie`. Ví dụ sau khi đã biết URL backend:

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://BACKEND-HOST/api/:path*" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Thay `BACKEND-HOST` bằng host thật nếu triển khai backend khác. Cấu hình đã áp dụng cho deployment hiện tại nằm ở phần dưới. Vite dev proxy và `VITE_BACKEND_PROXY_TARGET` chỉ phục vụ phát triển local.

Chỉ đặt biến công khai `VITE_*` ở frontend. Mật khẩu PostgreSQL/admin, JWT secret, ZaloPay keys và AI API key đặt trong môi trường của backend, theo `.env.example`, không đưa lên GitHub hoặc bundle frontend. Sau khi đổi `VITE_API_BASE_URL`, deploy lại frontend.

Trước khi coi deployment hoàn tất, kiểm tra tải lại đường dẫn chi tiết, đăng nhập, refresh trang giữ phiên, đăng xuất và API với HTTPS.

## Kết nối production hiện tại

- Frontend: `https://dutconnect.vercel.app`.
- Backend: `https://dut-connect.onrender.com`.
- `frontend/vercel.json` chuyển `/api/:path*` tới `https://dut-connect.onrender.com/api/:path*` trước rewrite SPA. Ví dụ `/api/v1/campaigns` giữ nguyên đường dẫn `/api/v1/campaigns` ở backend.
- Trên Vercel, giữ `VITE_API_BASE_URL=/api/v1` hoặc bỏ biến để dùng mặc định này; không trỏ trình duyệt trực tiếp sang Render. Nếu trước đó đã đặt giá trị khác, sửa rồi redeploy.
- Trên Render, đặt `SPRING_PROFILES_ACTIVE=prod` và `APP_ALLOWED_ORIGINS=https://dutconnect.vercel.app` (không có dấu `/` cuối).
- Dùng domain production để kiểm tra đăng nhập. Domain riêng của mỗi deployment/preview chưa được thêm vào allowlist Origin của backend.
- Cookie refresh HttpOnly/Secure, host-only, path `/api/v1/auth` được trình duyệt nhận dưới domain frontend qua proxy; không thay SameSite hay đưa token vào localStorage.
- Không cần sửa `application-prod.yml`; thông tin database/secret vẫn là biến môi trường riêng trên Render.

Backend readiness đã trả HTTP 200, `{"status":"UP"}`. Database Neon mới chưa có chiến dịch/tổ chức/tài khoản demo từ Docker local; danh sách rỗng là bình thường sau khi kết nối thành công. Không tự nhập dữ liệu kiểm tra vào production.

## Frontend khi backend chưa sẵn sàng

Vercel có thể trả `index.html` với HTTP 200 cho đường dẫn API chưa có proxy. Lớp API frontend từ chối phản hồi HTML/non-JSON thay vì lưu nó vào cache truy vấn hoặc phiên đăng nhập. Trang chủ, chiến dịch và tổ chức vẫn hiển thị giao diện, kèm thông báo “Dịch vụ dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.” Đăng nhập sẽ không tạo phiên từ phản hồi này. Phản hồi không có nội dung 204/205 và tải báo cáo dạng binary vẫn được hỗ trợ.

Kiểm tra thủ công ngày 2026-10-04 trên bản frontend build: máy chủ static cục bộ mô phỏng API trả HTML 200 cho GET/POST; các trang `/`, `/campaigns`, `/organizations`, `/login` không còn lỗi JavaScript và đăng nhập không chuyển trang. Chuyển API GET sang backend local thật trả JSON khôi phục 6 card chiến dịch và 3 card tổ chức trên trang chủ. `npm run build` thành công. Chưa kiểm tra deployment Vercel mới hoặc API production vì backend production chưa được cấu hình.
