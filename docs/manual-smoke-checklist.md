# Kiểm tra thủ công bản giữa kỳ

Không tạo bộ kiểm thử tự động. Kiểm tra trên database cô lập trước khi phát hành.

- Build Java 21/Spring Boot 3.4.3 và frontend; xem kết quả Flyway/Hibernate validate.
- Edition MIDTERM, schema ứng dụng có đúng 19 bảng; DBML parse được.
- Đăng ký đúng/sai định dạng MSV/email, ngăn trùng; đăng nhập ADMIN/USER.
- Reload/refresh xoay token, logout thu hồi cookie; USER không vào được API ADMIN.
- Đổi hồ sơ/kỹ năng; upload/đọc/xóa avatar và chặn version cũ.
- Tạo tổ chức, xác minh; kiểm tra quyền thành viên/chuyển chủ sở hữu.
- Gửi đề xuất, duyệt/từ chối; duyệt lặp không tạo hai chiến dịch.
- Chỉ có chế độ tình nguyện; chặn nhập chế độ/kế hoạch tài chính vào API.
- Cập nhật yêu cầu kỹ năng/quản lý; mở, bắt đầu, hoàn thành/hủy; trạng thái cuối không mở lại.
- Sinh viên đăng ký; ngăn trùng; nhận/từ chối, hủy hồ sơ đang chờ; người ngoài không xét duyệt được.
- Họp online/offline; người được nhận xem, người ngoài bị từ chối; kiểm tra đường dẫn lịch họp từ đăng ký đã nhận.
- Tạo buổi điểm danh; chỉ ghi cho người được nhận; chặn version cũ và người ngoài.
- Dashboard dùng số liệu còn lại; Excel tải được, chỉ gồm đăng ký/nhóm/điểm danh.
- Các route thanh toán/tài chính/nhiệm vụ/hoàn thành/Google không còn hoạt động.
- AI disabled hiển thị đúng, không tạo kết quả giả hay đổi trạng thái hồ sơ.
- Giữ ảnh DUT, background, card và nút; VI/EN; 320/390/768/1440px không tràn ngang.
- Khởi động lại không tạo trùng seed hoặc dịch lịch. Không có người/tiền/giờ công giả.
- Thử chuyển fixture bản đầy đủ: dữ liệu tương thích được sao chép; fingerprint 28 bảng nguồn không đổi.
- Sau deploy kiểm tra edition API, danh sách và bộ lọc; kiểm tra frontend dùng bundle mới, không còn menu chức năng đã hoãn.
