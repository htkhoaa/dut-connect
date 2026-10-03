const labels: Record<string, string> = {
    'Community Support': 'Hỗ trợ cộng đồng', Education: 'Giáo dục', Environment: 'Môi trường',
    'Disaster Relief': 'Cứu trợ thiên tai', 'Campus Support': 'Hỗ trợ sinh viên', Other: 'Khác',
    Programming: 'Lập trình', 'Graphic Design': 'Thiết kế đồ họa', Photography: 'Nhiếp ảnh',
    'Video Editing': 'Biên tập video', Communication: 'Truyền thông', Tutoring: 'Giảng dạy',
    'Data Entry': 'Nhập liệu', 'Electrical Support': 'Hỗ trợ điện', Logistics: 'Hậu cần',
    'Event Operations': 'Tổ chức sự kiện', 'University Youth Union': 'Đoàn trường',
    'Faculty Youth Union': 'Liên chi đoàn khoa', 'Student Association': 'Hội sinh viên',
    Club: 'Câu lạc bộ', 'Student Team': 'Đội sinh viên',
};
export function catalogLabel(value: string): string { return labels[value] || value; }
