import type {AccountStatus} from './types';
import type {BadgeTone} from '../../shared/components/Badge';

export const accountStatuses: Record<AccountStatus, {label: string; tone: BadgeTone}> = {
    ACTIVE: {label: 'Đang hoạt động', tone: 'success'},
    SUSPENDED: {label: 'Tạm ngừng', tone: 'danger'},
};
