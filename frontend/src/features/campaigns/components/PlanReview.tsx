import { tr, useLanguage } from '../../../shared/lib/i18n';
import { catalogLabel } from '../../../shared/lib/catalogLabels';
import { Button } from '../../../shared/components/Button';
import { modes } from '../presentation';
import type { Category, FormValues, OrganizationOption } from '../types';
import type { PendingPlanImage } from './planTypes';

interface PlanReviewProps {
    values: FormValues;
    categories: Category[];
    organizations: OrganizationOption[];
    pendingImages: PendingPlanImage[];
    onEditDetails: () => void;
    onEditResources: () => void;
}
export function PlanReview({
    values,
    categories,
    organizations,
    pendingImages,
    onEditDetails,
    onEditResources,
}: PlanReviewProps) {
    useLanguage();
    return (
        <section className="space-y-4 rounded-2xl border border-border p-5">
            <h3 className="text-lg font-bold">{tr('Kiểm tra kế hoạch trước khi gửi')}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
                <dt>{tr('Tiêu đề')}</dt>
                <dd className="break-words font-semibold">{values.title}</dd>
                <dt>{tr('Đơn vị tổ chức')}</dt>
                <dd>
                    {values.organizerType === 'INDIVIDUAL'
                        ? tr('Cá nhân')
                        : organizations.find((o) => o.id === values.organizationId)?.name}
                </dd>
                <dt>{tr('Danh mục')}</dt>
                <dd>
                    {catalogLabel(categories.find((c) => c.id === values.categoryId)?.name || '')}
                </dd>
                <dt>{tr('Hình thức đóng góp')}</dt>
                <dd>{tr(modes[values.contributionMode as keyof typeof modes])}</dd>
                <dt>{tr('Thời gian')}</dt>
                <dd>
                    {values.startDate} → {values.endDate}
                </dd>
                <dt>{tr('Hình ảnh')}</dt>
                <dd>{pendingImages.length}</dd>
            </dl>
            <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
                {values.summary}
            </p>
            <details className="rounded-xl bg-surface-muted p-4 text-sm">
                <summary className="cursor-pointer font-semibold">
                    {tr('Xem nội dung chi tiết')}
                </summary>
                <p className="mt-3 whitespace-pre-wrap break-words">{values.description}</p>
                <p className="mt-3 whitespace-pre-wrap break-words">{values.expectedImpact}</p>
            </details>
            {values.contributionMode !== 'VOLUNTEER_ONLY' && (
                <p className="text-sm">
                    {tr('Mục tiêu gây quỹ (VND) *')}: {values.fundraisingGoal} VND ·{' '}
                    {tr('Hạn gây quỹ *')}: {values.fundraisingDeadline}
                </p>
            )}
            {values.contributionMode !== 'DONATION_ONLY' && (
                <p className="text-sm">
                    {tr('Tổng tình nguyện viên *')}: {values.targetVolunteerCount} ·{' '}
                    {tr('Hạn đăng ký')}: {values.applicationDeadline}
                </p>
            )}
            {pendingImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                    {pendingImages.map((image) => (
                        <img
                            key={image.id}
                            src={image.previewUrl}
                            alt={image.caption || tr('Hình ảnh chiến dịch')}
                            className="h-24 w-32 shrink-0 rounded-lg object-cover"
                        />
                    ))}
                </div>
            )}
            <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onEditDetails}>
                    {tr('Sửa nội dung')}
                </Button>
                <Button type="button" variant="secondary" onClick={onEditResources}>
                    {tr('Sửa thời gian và nguồn lực')}
                </Button>
            </div>
            <p className="text-sm text-text-secondary">
                {tr('Sau khi gửi, theo dõi kết quả xét duyệt trong Đề xuất của tôi.')}
            </p>
        </section>
    );
}
