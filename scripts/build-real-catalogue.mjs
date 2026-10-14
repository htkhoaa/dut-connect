// Regenerates the bundled operational simulation catalogue from researched content.
import fs from 'node:fs';
import {activities} from './real-activity-content.mjs';
const spring = 'https://dut.udn.vn/Fast/Tintuc/id/11702';
const fpm = 'https://fpm.dut.udn.vn/tin-tuc/chi-tiet/FPM---Chu-nhat-xanh-1867';
const org = (key, name, type, description, source) => ({key: 'dut-v1-org-' + key, name, type,
    description: description + '\n\nNguồn hoạt động: ' + source + '\n\nHồ sơ phục vụ trải nghiệm DUT Connect, do quản trị viên quản lý; không khẳng định đơn vị đã đăng ký trên nền tảng.'});
const organizations = [
    org('union', 'Đoàn Thanh niên Trường Đại học Bách khoa – Đại học Đà Nẵng', 'UNIVERSITY_YOUTH_UNION', 'Kết nối các đội hình Bách khoa với cộng đồng qua Mùa hè xanh, Xuân tình nguyện và hiến máu. Sinh viên góp sức trong tổ chức, hậu cần và hỗ trợ địa phương.', activities[0].source),
    org('association', 'Hội Sinh viên Trường Đại học Bách khoa – Đại học Đà Nẵng', 'STUDENT_ASSOCIATION', 'Đồng hành cùng sinh viên và Đoàn trường trong hoạt động cộng đồng. Bài ra quân Xuân tình nguyện 2026 ghi nhận sự tham gia của Hội Sinh viên cùng các liên chi đoàn, câu lạc bộ, đội và nhóm.', spring),
    org('heat', 'CLB Sức trẻ Khoa Công nghệ Nhiệt – Điện lạnh', 'CLUB', 'Cộng đồng sinh viên cùng hành động vì môi trường. Hoạt động Chủ nhật xanh tại biển Nguyễn Tất Thành ngày 29/03/2026 thể hiện tinh thần bảo vệ không gian biển.', activities[2].source),
    org('project', 'Liên Chi đoàn Khoa Quản lý Dự án', 'FACULTY_YOUTH_UNION', 'Tập hợp đoàn viên gìn giữ khuôn viên xanh. Bài FPM – Chủ nhật xanh ghi nhận đoàn viên tham gia dọn khu A ngày 18/01/2022.', fpm),
    org('advice', 'Đội Tư vấn sinh viên Trường Đại học Bách khoa', 'STUDENT_TEAM', 'Đội sinh viên có đại diện phát biểu tại lễ ra quân Xuân tình nguyện 2026. Hồ sơ giới thiệu tinh thần sẻ chia và kết nối đội hình phục vụ cộng đồng.', spring),
];
const configs = [[0, 'union', 'OPEN', 150, 300, 120, 100], [1, 'association', 'OPEN', 150, 270, 120, 80],
    [2, 'heat', 'ACTIVE', -30, 180, -40, 40], [4, 'union', 'COMPLETED', -150, -120, -160, 60]];
const notice = '\n\nLỊCH MÔ PHỎNG: Ngày tuyển, ngày hoạt động, trạng thái và số vị trí được bố trí lại để trải nghiệm DUT Connect. Đây không phải thông báo tuyển mới của nhà trường.\n\nNội dung tham gia: chuẩn bị dụng cụ và vật tư, phối hợp đội hình, tham gia hướng dẫn an toàn, thực hiện công việc theo phân công và tổng kết bài học. Không nhập người tham gia, giờ công hoặc khoản tiền giả.';
const campaigns = configs.map(([i, unit, status, startOffset, endOffset, deadlineOffset, capacity]) => {
    const a = activities[i];
    return {key: 'dut-v1-campaign-' + (i + 1), organization: 'dut-v1-org-' + unit, category: a.category,
        title: a.vi.title, summary: a.vi.summary + ' Lịch và chỉ tiêu tuyển trên DUT Connect là mô phỏng.',
        description: a.vi.description + '\n\nNguồn sự kiện thật: ' + a.source + '\nThời gian gốc: ' + a.vi.period + notice,
        status, startOffset, endOffset, deadlineOffset, capacity};
});
const extra = (key, unit, title, summary, status, startOffset, endOffset, deadlineOffset, source, detail) => ({
    key: 'dut-v1-campaign-' + key, organization: 'dut-v1-org-' + unit, category: 'environment', title,
    summary: summary + ' Lịch mô phỏng.', description: detail + '\n\nNguồn sự kiện thật: ' + source + notice,
    status, startOffset, endOffset, deadlineOffset, capacity: 35,
});
campaigns.push(extra('fpm', 'project', 'FPM – Chủ nhật xanh tại khu A', 'Cùng đoàn viên Quản lý Dự án chăm sóc khuôn viên Bách khoa.', 'ACTIVE', -20, 200, -30, fpm, 'Bài của Khoa Quản lý Dự án ghi nhận hoạt động dọn vệ sinh và phát quang khu A. Trên DUT Connect, chương trình được dùng làm kịch bản phối hợp tình nguyện vì môi trường.'));
campaigns.push(extra('environment', 'project', 'Chủ nhật xanh – Không gian học tập xanh', 'Trải nghiệm tổ chức ngày hành động vì khuôn viên sạch.', 'COMPLETED', -90, -60, -100, fpm, 'Kịch bản dựa trên hoạt động Chủ nhật xanh do Liên Chi đoàn Khoa Quản lý Dự án công bố. Trạng thái hoàn thành phản ánh kịch bản trình diễn, không chứng nhận kết quả trong hệ thống.'));
campaigns.push({...extra('advice', 'advice', 'Xuân tình nguyện – Cùng sẻ chia với cộng đồng', 'Kết nối đội hình sinh viên, chuẩn bị hậu cần và hỗ trợ cộng đồng.', 'CANCELLED', 30, 90, 20, spring, 'Bài ra quân Xuân tình nguyện ghi nhận đại diện Đội Tư vấn sinh viên phát biểu. Kịch bản minh họa một đợt bị hủy; việc hủy là mô phỏng, không phải sự kiện lịch sử.'), category: 'community-support'});
campaigns.push({...extra('blood-draft', 'union', 'Ngày hội hiến máu – Kế hoạch đội hình hỗ trợ', 'Chuẩn bị hướng dẫn, đón tiếp và hỗ trợ ngày hội hiến máu.', 'DRAFT', 180, 210, 150, activities[4].source, 'Lấy cảm hứng từ Ngày hội hiến máu nhân đạo DUT đợt 2 năm 2021. Kế hoạch mô phỏng chưa công khai tuyển, không phải lịch hiến máu chính thức.'), category: 'community-support'});
fs.mkdirSync('backend/src/main/resources/catalogue', {recursive: true});
fs.writeFileSync('backend/src/main/resources/catalogue/dut-catalogue.json', JSON.stringify({organizations, campaigns}, null, 2) + '\n');
console.log(`Generated ${organizations.length} organizations and ${campaigns.length} campaigns.`);
