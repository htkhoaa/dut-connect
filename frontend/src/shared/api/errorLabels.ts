const codes: Record<string, string> = {
    VALIDATION_ERROR: 'Vui lòng kiểm tra thông tin đã nhập.', AUTHENTICATION_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.', ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
    RESOURCE_NOT_FOUND: 'Không tìm thấy thông tin bạn yêu cầu.', CONFLICT: 'Thông tin đã tồn tại hoặc vừa được thay đổi. Vui lòng kiểm tra lại.',
    INVALID_STATE_TRANSITION: 'Không thể thực hiện thao tác ở trạng thái hiện tại.', DUPLICATE_APPLICATION: 'Bạn đã đăng ký chiến dịch này.',
    ORGANIZATION_NOT_VERIFIED: 'Tổ chức cần được xác minh trước khi thực hiện thao tác.', NOT_ORGANIZATION_MEMBER: 'Bạn cần là thành viên được cấp quyền của tổ chức.',
    CAMPAIGN_NOT_OPEN: 'Chiến dịch chưa mở tuyển tình nguyện viên.', CAMPAIGN_NOT_ACCEPTING_VOLUNTEERS: 'Chiến dịch hiện không nhận đăng ký tình nguyện.',
    CAMPAIGN_NOT_ACCEPTING_DONATIONS: 'Chiến dịch hiện không nhận đóng góp tài chính.', VOLUNTEER_NOT_ACCEPTED: 'Tình nguyện viên chưa được chấp nhận tham gia.',
    PAYMENT_PROVIDER_ERROR: 'Chưa thể kết nối cổng thanh toán. Vui lòng thử lại.', PAYMENT_VERIFICATION_FAILED: 'Chưa thể xác minh kết quả thanh toán.',
    PAYMENT_AMOUNT_MISMATCH: 'Số tiền thanh toán không khớp. Vui lòng kiểm tra trạng thái.', PAYMENT_ALREADY_PROCESSED: 'Thanh toán đã được xử lý.',
    EXPENSE_NOT_PENDING: 'Chi phí đã được xét duyệt và không thể chỉnh sửa.', AI_PROVIDER_UNAVAILABLE: 'Gợi ý AI chưa khả dụng. Bạn vẫn có thể xét duyệt đăng ký.',
    OPTIMISTIC_LOCK_CONFLICT: 'Thông tin vừa được cập nhật bởi người khác. Tải lại trước khi lưu.', SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời chưa khả dụng.',
    INTERNAL_ERROR: 'Hệ thống chưa xử lý được yêu cầu. Vui lòng thử lại.', METHOD_NOT_ALLOWED: 'Thao tác không được hỗ trợ.',
    NOT_ACCEPTABLE: 'Định dạng dữ liệu yêu cầu chưa được hỗ trợ.',
};
export function errorLabel(code: string, status: number): string {
    return codes[code] || (status === 401 ? codes.AUTHENTICATION_REQUIRED : status === 403 ? codes.ACCESS_DENIED : status === 404 ? codes.RESOURCE_NOT_FOUND : status === 409 ? codes.CONFLICT : status >= 500 ? codes.INTERNAL_ERROR : codes.VALIDATION_ERROR);
}
export function validationLabel(message: string): string {
    if (/[^\x00-\x7F]/.test(message) && /[ăâđêôơư]/i.test(message)) return message;
    if (/unique|duplicate|already/i.test(message)) return /email/i.test(message) ? 'Email đã được sử dụng.' : /student/i.test(message) ? 'Mã sinh viên đã tồn tại.' : 'Thông tin đã tồn tại hoặc bị trùng lặp.';
    const limit = message.match(/(?:at most|max(?:imum)?|between \d+ and)\s+(\d+)/i);
    if (/email/i.test(message)) return 'Nhập địa chỉ email hợp lệ.';
    if (/password|UTF-8/i.test(message)) return 'Mật khẩu cần từ 8 ký tự và tối đa 72 byte UTF-8.';
    if (/must not be (?:blank|null|empty)|required|notnull/i.test(message)) return limit ? 'Thông tin bắt buộc, tối đa ' + limit[1] + ' ký tự.' : 'Vui lòng nhập thông tin này.';
    if (/date|time|end|start/i.test(message)) return 'Kiểm tra ngày, giờ và thứ tự bắt đầu – kết thúc.';
    if (/integer|decimal|amount|money|VND|digits/i.test(message)) return 'Nhập số tiền VND nguyên nằm trong giới hạn cho phép.';
    if (/positive|greater|negative/i.test(message)) return 'Kiểm tra giới hạn của giá trị đã nhập.';
    if (/URL|HTTP/i.test(message)) return 'Nhập liên kết HTTP(S) hợp lệ.';
    if (limit) return 'Nhập tối đa ' + limit[1] + ' ký tự.';
    return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
}
