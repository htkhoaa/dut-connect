import {OrganizationForm} from './components/OrganizationForm';
import {Card} from '../../shared/components/Card';
import {PageHeader} from '../../shared/components/PageHeader';
import {Icon} from '../../shared/components/Icon';
export function CreateOrganizationPage() {
    return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="KẾT NỐI ĐỘI NGŨ" title="Bắt đầu từ một tổ chức" description="Đưa đoàn, hội, câu lạc bộ hoặc đội sinh viên của bạn vào một không gian hoạt động chung."/>
        <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]"><Card><h2 className="mb-5 text-lg font-semibold">Thông tin tổ chức</h2><OrganizationForm/></Card>
            <aside className="rounded-2xl border border-primary-muted bg-primary-light p-6"><Icon name="building" size={32} className="mb-5 text-primary"/><h2 className="text-lg font-semibold">Cùng xây dựng một đội ngũ</h2><ol className="mt-5 space-y-5 text-sm text-text-secondary"><li><strong className="mb-1 block text-text-primary">01 · Giới thiệu tổ chức</strong>Điền tên, loại hình và những hoạt động bạn muốn thực hiện.</li><li><strong className="mb-1 block text-text-primary">02 · Xác minh thông tin</strong>Quản trị viên xét duyệt trước khi tổ chức được đại diện trong các đề xuất.</li><li><strong className="mb-1 block text-text-primary">03 · Kết nối thành viên</strong>Bạn là chủ sở hữu và có thể phân quyền quản lý cho thành viên phù hợp.</li></ol></aside>
        </div>
    </div>;
}
