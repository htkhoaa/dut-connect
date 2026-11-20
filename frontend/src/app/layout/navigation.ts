import type { IconName } from '../../shared/components/Icon';

type AdminItem = { to: string; label: string; icon: IconName };
export const adminItems: AdminItem[] = [
    { to: '/admin', label: 'Tổng quan', icon: 'grid' },
    { to: '/admin/proposals', label: 'Duyệt đề xuất', icon: 'file' },
    { to: '/admin/expenses', label: 'Duyệt chi phí', icon: 'file' },
    { to: '/admin/organizations', label: 'Xác minh tổ chức', icon: 'shield' },
    { to: '/admin/payouts', label: 'Giải ngân quyên góp', icon: 'heart' },
    { to: '/admin/users', label: 'Người dùng', icon: 'users' },
    { to: '/admin/categories', label: 'Danh mục', icon: 'grid' },
];
