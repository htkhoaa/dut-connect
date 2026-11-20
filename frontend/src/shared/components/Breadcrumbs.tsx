import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { tr, useLanguage } from '../lib/i18n';

type Crumb = { label: string; to?: string };
const pages: Record<string, string> = {
    '/me': 'Không gian của tôi',
    '/guide': 'Hướng dẫn tham gia',
    '/campaigns': 'Chiến dịch',
    '/organizations': 'Tổ chức',
    '/organizations/new': 'Tạo tổ chức',
    '/proposals': 'Đề xuất của tôi',
    '/proposals/new': 'Tạo đề xuất',
    '/manage/campaigns': 'Chiến dịch tôi quản lý',
    '/me/profile': 'Hồ sơ cá nhân',
    '/me/settings': 'Cài đặt',
    '/me/donations': 'Quyên góp của tôi',
    '/me/applications': 'Đăng ký của tôi',
    '/me/tasks': 'Nhiệm vụ của tôi',
    '/me/history': 'Lịch sử tham gia',
    '/me/organizations': 'Tổ chức của tôi',
    '/admin': 'Quản trị hệ thống',
    '/admin/users': 'Người dùng',
    '/admin/organizations': 'Xác minh tổ chức',
    '/admin/proposals': 'Duyệt đề xuất',
    '/admin/expenses': 'Duyệt chi phí',
    '/admin/categories': 'Danh mục',
    '/admin/payouts': 'Giải ngân quyên góp',
    '/login': 'Đăng nhập',
    '/login-admin': 'Đăng nhập quản trị',
    '/payment/result': 'Kết quả thanh toán',
    '/attendance/checkin': 'Điểm danh',
};
const campaignSections: Record<string, string> = {
    applications: 'Đăng ký tình nguyện',
    team: 'Đội tình nguyện',
    tasks: 'Nhiệm vụ',
    meetings: 'Lịch họp',
    attendance: 'Điểm danh',
    completions: 'Xác minh hoàn thành',
    finance: 'Tài chính',
    reports: 'Báo cáo',
};
function crumbsFor(path: string): Crumb[] {
    if (path.startsWith('/tasks/'))
        return [{ label: 'Nhiệm vụ của tôi', to: '/me/tasks' }, { label: 'Chi tiết nhiệm vụ' }];
    if (path.startsWith('/donations/'))
        return [
            { label: 'Quyên góp của tôi', to: '/me/donations' },
            { label: 'Kết quả thanh toán' },
        ];
    if (/^\/me\/campaigns\/[^/]+\/meetings$/.test(path))
        return [{ label: 'Đăng ký của tôi', to: '/me/applications' }, { label: 'Lịch họp' }];
    const campaign = path.match(/^\/manage\/campaigns\/([^/]+)(?:\/([^/]+))?$/);
    if (campaign)
        return [
            { label: pages['/manage/campaigns'], to: '/manage/campaigns' },
            {
                label: 'Quản lý chiến dịch',
                to: campaign[2] ? `/manage/campaigns/${campaign[1]}` : undefined,
            },
            ...(campaign[2] ? [{ label: campaignSections[campaign[2]] || 'Chi tiết' }] : []),
        ];
    for (const [prefix, label] of [
        ['/campaigns/', 'Chi tiết chiến dịch'],
        ['/organizations/', 'Chi tiết tổ chức'],
        ['/proposals/', 'Chi tiết đề xuất'],
        ['/activities/', 'Chi tiết hoạt động'],
    ] as const) {
        if (path.startsWith(prefix) && !pages[path])
            return [
                {
                    label: prefix === '/activities/' ? 'Chiến dịch' : pages[prefix.slice(0, -1)],
                    to: prefix === '/activities/' ? '/campaigns' : prefix.slice(0, -1),
                },
                { label },
            ];
    }
    if (!pages[path]) return [];
    const parent = path.startsWith('/admin/')
        ? '/admin'
        : path.startsWith('/me/')
          ? '/me'
          : path === '/proposals/new'
            ? '/proposals'
            : path === '/organizations/new'
              ? '/organizations'
              : null;
    return [...(parent ? [{ label: pages[parent], to: parent }] : []), { label: pages[path] }];
}
export function Breadcrumbs() {
    const { language } = useLanguage();
    const { pathname } = useLocation();
    const crumbs = crumbsFor(pathname);
    useEffect(() => {
        const update = () => {
            const heading = document.querySelector('main h1')?.textContent?.trim();
            document.title = `${heading || tr(crumbsFor(pathname).at(-1)?.label || 'Trang chủ')} | DUT Connect`;
        };
        update();
        const main = document.getElementById('main-content');
        const observer = new MutationObserver(update);
        if (main) observer.observe(main, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [pathname, language]);
    if (pathname === '/' || !crumbs.length) return null;
    return (
        <nav aria-label={tr('Đường dẫn trang')} className="mb-6 text-sm text-text-secondary">
            <ol className="flex flex-wrap items-center gap-2">
                <li>
                    <Link className="hover:text-primary underline-offset-4 hover:underline" to="/">
                        {tr('Trang chủ')}
                    </Link>
                </li>
                {crumbs.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span aria-hidden="true">/</span>
                        {c.to ? (
                            <Link className="hover:text-primary hover:underline" to={c.to}>
                                {tr(c.label)}
                            </Link>
                        ) : (
                            <span aria-current="page" className="font-medium text-text-primary">
                                {tr(c.label)}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
