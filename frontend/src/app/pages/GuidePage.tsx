import {Link} from 'react-router-dom';
import {PageHeader} from '../../shared/components/PageHeader';
import {tr, useLanguage} from '../../shared/lib/i18n';

const paths = [
    {title: 'Tôi muốn tham gia tình nguyện', to: '/campaigns', action: 'Khám phá chiến dịch', steps: ['Chọn chiến dịch đang mở tuyển và đọc yêu cầu.', 'Đăng nhập, hoàn thiện hồ sơ rồi gửi đăng ký.', 'Theo dõi xét duyệt trong Đăng ký của tôi.', 'Khi được nhận, theo dõi nhiệm vụ, lịch họp và điểm danh.']},
    {title: 'Tôi muốn quyên góp', to: '/campaigns', action: 'Chọn chiến dịch gây quỹ', steps: ['Chọn chiến dịch đang nhận đóng góp và xem mục tiêu gây quỹ.', 'Đăng nhập, nhập số tiền và thực hiện thanh toán.', 'Chỉ khoản thanh toán thành công mới được tính vào tiến độ.', 'Theo dõi kết quả trong Quyên góp của tôi và chi phí công khai.']},
    {title: 'Tôi muốn tổ chức chiến dịch', to: '/proposals/new', action: 'Tạo đề xuất', steps: ['Chọn cá nhân hoặc tổ chức đã xác minh mà bạn có quyền đại diện.', 'Điền nội dung, thời gian, nguồn lực và hình ảnh.', 'Kiểm tra kế hoạch rồi gửi xét duyệt; theo dõi trong Đề xuất của tôi.', 'Khi được duyệt, mở Chiến dịch tôi quản lý để điều phối và báo cáo.']},
];
export function GuidePage() {
    useLanguage();
    return <div className="mx-auto max-w-5xl space-y-7"><PageHeader title={tr('Hướng dẫn tham gia')} description={tr('Bắt đầu từ mục tiêu của bạn và theo dõi từng bước trên DUT Connect.')}/>
        {paths.map(path => <section key={path.title} className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-xl font-bold">{tr(path.title)}</h2>
            <ol className="my-5 space-y-3">{path.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary">{i + 1}</span><span className="pt-1">{tr(step)}</span></li>)}</ol>
            <Link className="ui-button ui-button-primary" to={path.to}>{tr(path.action)} →</Link>
        </section>)}
    </div>;
}
