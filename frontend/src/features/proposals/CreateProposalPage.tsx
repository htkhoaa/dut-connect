import {PlanForm} from '../campaigns/components/PlanForm';
import {Card} from '../../shared/components/Card';
import {PageHeader} from '../../shared/components/PageHeader';
import {Icon} from '../../shared/components/Icon';
export function CreateProposalPage() {
    return <div className="mx-auto max-w-5xl space-y-5"><PageHeader eyebrow="TỪ Ý TƯỞNG ĐẾN HÀNH ĐỘNG" title="Một ý tưởng. Một khởi đầu mới." description="Gửi đề xuất cá nhân hoặc đại diện tổ chức đã xác minh. Trình bày rõ hoạt động, nguồn lực và giá trị bạn muốn mang lại."/>
        <div className="flex items-start gap-3 rounded-xl border border-primary-muted bg-primary-light p-4"><Icon name="shield" className="shrink-0 text-primary"/><p className="text-sm text-text-secondary">Sau khi quản trị viên duyệt, đề xuất trở thành chiến dịch nháp để bạn hoàn thiện kế hoạch trước khi mở tuyển.</p></div><Card><PlanForm/></Card>
    </div>;
}
