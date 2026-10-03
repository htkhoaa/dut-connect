import type {AccountStatus} from '../../auth/types';

export interface ChangeStatusRequest {
    id: string;
    status: AccountStatus;
    version: number;
}
