import type {BadgeTone} from '../../shared/components/Badge';
import type {ExpenseStatus} from './types';
export const expenseStatuses:Record<ExpenseStatus,{label:string;tone:BadgeTone}>={PENDING:{label:'Chờ duyệt',tone:'neutral'},APPROVED:{label:'Đã duyệt',tone:'success'},REJECTED:{label:'Đã từ chối',tone:'danger'}};
export function localDate(date:string){return new Date(date+'T00:00:00').toLocaleDateString('vi-VN');}
