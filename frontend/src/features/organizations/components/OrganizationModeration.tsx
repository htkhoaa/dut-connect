import {useState} from 'react';
import type {OrganizationDetail, Moderation} from '../types';
import {useModerateOrganization} from '../hooks';
import {Button} from '../../../shared/components/Button';
import {ErrorState} from '../../../shared/components/ErrorState';
import {ConfirmDialog} from '../../../shared/components/ConfirmDialog';
import {errorMessage} from '../../../shared/api/errors';

const labels: Record<Moderation, string> = {verify: 'Xác minh', suspend: 'Tạm ngừng', restore: 'Khôi phục'};
export function OrganizationModeration({detail}: {detail: OrganizationDetail}) {
    const mutation = useModerateOrganization(detail.organization.id);
    const [confirmation, setConfirmation] = useState<{command: Moderation; version: number} | null>(null);
    const command: Moderation = detail.organization.status === 'PENDING_VERIFICATION' ? 'verify' : detail.organization.status === 'VERIFIED' ? 'suspend' : 'restore';
    return <section className="space-y-4" aria-label="Xác minh tổ chức">
        <h2 className="text-xl font-semibold">Xét duyệt</h2>
        <Button disabled={mutation.isPending} onClick={() => setConfirmation({command, version: detail.organization.version})}>{labels[command]} tổ chức</Button>
        {mutation.isError && <ErrorState message={errorMessage(mutation.error)}/>}
        {mutation.isSuccess && <p role="status" className="text-success">Đã cập nhật trạng thái tổ chức.</p>}
        <ConfirmDialog open={confirmation !== null} title={confirmation ? labels[confirmation.command] + ' organization?' : ''}
                       message={confirmation?.command === 'suspend' ? 'Người đại diện sẽ không còn quyền hành động thay mặt tổ chức này.' : 'Xác nhận tổ chức đủ điều kiện được đại diện.'}
                       confirmLabel="Xác nhận" busy={mutation.isPending} onClose={() => setConfirmation(null)} onConfirm={() => {
                           if (confirmation) mutation.mutate(confirmation, {onSettled: () => setConfirmation(null)});
                       }}/>
    </section>;
}
