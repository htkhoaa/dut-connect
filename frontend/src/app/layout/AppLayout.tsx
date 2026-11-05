import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {Suspense, useEffect, useRef, useState} from 'react';
import {useAuth} from '../../features/auth/store';
import {useInitializeAuth, useLogout} from '../../features/auth/hooks';
import {Icon, type IconName} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';
import {UserAvatar} from '../../features/profile/avatar';
import {LanguageSwitch} from '../../shared/components/LanguageSwitch';

type AdminItem = {to: string; label: string; icon: IconName};
const adminItems: AdminItem[] = [
    {to: '/admin', label: 'Tổng quan', icon: 'grid'},
    {to: '/admin/proposals', label: 'Duyệt đề xuất', icon: 'file'},
    {to: '/admin/organizations', label: 'Xác minh tổ chức', icon: 'shield'},
    {to: '/admin/expenses', label: 'Duyệt chi phí', icon: 'file'},
    {to: '/admin/payouts', label: 'Giải ngân quyên góp', icon: 'heart'},
    {to: '/admin/users', label: 'Người dùng', icon: 'users'},
    {to: '/admin/categories', label: 'Danh mục', icon: 'grid'},
];

function Brand() {
    useLanguage();
    return (
        <Link to="/" className="brand" aria-label={tr("DUT Connect – Trang chủ")}>
            <img className="brand-logo" src="/images/dut-logo-51.png" alt={tr("Logo kỷ niệm 51 năm Đại học Bách khoa Đà Nẵng")}/>
            <span>DUT<span className="font-normal"> Connect</span><small>{tr("KẾT NỐI ĐỂ CỐNG HIẾN")}</small></span>
        </Link>
    );
}

export function AppLayout() {
    useLanguage();
    useInitializeAuth();
    const {user, initialized} = useAuth();
    const logout = useLogout();
    const {pathname} = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isAdmin = user?.role === 'ADMIN';
    const isAdminRoute = pathname.startsWith('/admin');
    const privatePage = !!user && (/^\/(me|manage|admin|proposals|donations|payment|dev)(\/|$)/.test(pathname) || pathname === '/organizations/new');

    useEffect(() => {
        setDropdownOpen(false);
        setMobileNavOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`min-h-screen flex flex-col text-text-primary ${privatePage ? 'workspace-shell' : 'public-shell'}`}>
            <a className="skip-link" href="#main-content">{tr("Chuyển đến nội dung")}</a>

            {/* TOP HEADER */}
            <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md shadow-xs">
                <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2.5 sm:px-6">
                    {/* Left: Brand */}
                    <div className="flex items-center justify-start min-w-0">
                        <Brand />
                    </div>

                    {/* Center: Nav links - Perfectly Centered in Header */}
                    <nav className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-medium" aria-label={tr("Điều hướng chính")}>
                        <NavLink
                            to="/"
                            end
                            className={({isActive}) => `rounded-xl px-3 py-1.5 lg:px-3.5 lg:py-2 whitespace-nowrap transition-all ${
                                isActive ? 'bg-primary-light text-primary font-semibold shadow-2xs' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                            }`}
                        >
                            {tr("Trang chủ")}
                        </NavLink>
                        <NavLink
                            to="/campaigns"
                            className={({isActive}) => `rounded-xl px-3 py-1.5 lg:px-3.5 lg:py-2 whitespace-nowrap transition-all ${
                                isActive ? 'bg-primary-light text-primary font-semibold shadow-2xs' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                            }`}
                        >
                            {tr("Chiến dịch")}
                        </NavLink>
                        <NavLink
                            to="/organizations"
                            className={({isActive}) => `rounded-xl px-3 py-1.5 lg:px-3.5 lg:py-2 whitespace-nowrap transition-all ${
                                isActive ? 'bg-primary-light text-primary font-semibold shadow-2xs' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                            }`}
                        >
                            {tr("Tổ chức")}
                        </NavLink>
                        {user && (
                            <NavLink
                                to="/manage/campaigns"
                                className={({isActive}) => `rounded-xl px-3 py-1.5 lg:px-3.5 lg:py-2 whitespace-nowrap transition-all ${
                                    isActive ? 'bg-primary-light text-primary font-semibold shadow-2xs' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }`}
                            >
                                {tr("Chiến dịch của tôi")}
                            </NavLink>
                        )}
                        {user && (
                            <NavLink
                                to="/proposals"
                                className={({isActive}) => `rounded-xl px-3 py-1.5 lg:px-3.5 lg:py-2 whitespace-nowrap transition-all ${
                                    isActive ? 'bg-primary-light text-primary font-semibold shadow-2xs' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                }`}
                            >
                                {tr("Đề xuất")}
                            </NavLink>
                        )}
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-3 min-w-0">
                        <LanguageSwitch />

                        {initialized && (
                            user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2.5 rounded-full border border-border bg-surface p-1.5 pr-3 text-left transition-all hover:border-primary-muted hover:shadow-xs focus:outline-none"
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        aria-expanded={dropdownOpen}
                                        aria-haspopup="true"
                                    >
                                        <UserAvatar className="h-8 w-8" />
                                        <div className="hidden sm:block max-w-40 truncate">
                                            <p className="truncate text-xs font-bold leading-tight">{renderText(user.fullName)}</p>
                                            <p className="truncate text-[11px] text-text-secondary leading-tight">{renderText(isAdmin ? tr("Quản trị viên") : tr("Thành viên DUT"))}</p>
                                        </div>
                                        <Icon name="arrow" size={14} className={`text-text-secondary transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* DROPDOWN MENU */}
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 z-50">
                                            <div className="border-b border-border px-3 py-2.5">
                                                <p className="font-semibold text-sm truncate">{renderText(user.fullName)}</p>
                                                <p className="text-xs text-text-secondary truncate">{renderText(user.email)}</p>
                                                <p className="mt-1 inline-block rounded-md bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                                                    {renderText(user.studentId)}
                                                </p>
                                            </div>

                                            <div className="py-1">
                                                <Link to="/me/settings?tab=profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="users" size={16} className="text-primary"/>
                                                    <span>{tr("Hồ sơ & kỹ năng")}</span>
                                                </Link>
                                                <Link to="/me/tasks" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="check" size={16} className="text-primary"/>
                                                    <span>{tr("Nhiệm vụ của tôi")}</span>
                                                </Link>
                                                <Link to="/me/applications" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="heart" size={16} className="text-primary"/>
                                                    <span>{tr("Đăng ký tình nguyện")}</span>
                                                </Link>
                                                <Link to="/me/settings?tab=history" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="calendar" size={16} className="text-primary"/>
                                                    <span>{tr("Lịch sử đóng góp")}</span>
                                                </Link>
                                                <Link to="/me/settings?tab=donations" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="heart" size={16} className="text-primary"/>
                                                    <span>{tr("Khoản ủng hộ")}</span>
                                                </Link>
                                                <Link to="/me/settings?tab=organizations" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="building" size={16} className="text-primary"/>
                                                    <span>{tr("Tổ chức của tôi")}</span>
                                                </Link>
                                                <Link to="/me/settings?tab=proposals" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-surface-muted hover:text-text-primary transition-colors">
                                                    <Icon name="file" size={16} className="text-primary"/>
                                                    <span>{tr("Đề xuất chiến dịch")}</span>
                                                </Link>

                                                {isAdmin && (
                                                    <>
                                                        <div className="my-1 border-t border-border" />
                                                        <Link to="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light transition-colors">
                                                            <Icon name="shield" size={16} />
                                                            <span>{tr("Quản trị hệ thống")}</span>
                                                        </Link>
                                                    </>
                                                )}
                                            </div>

                                            <div className="border-t border-border pt-1">
                                                <button
                                                    type="button"
                                                    disabled={logout.isPending}
                                                    onClick={() => logout.mutate()}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
                                                >
                                                    <Icon name="logout" size={16} />
                                                    <span>{renderText(logout.isPending ? tr("Đang thoát…") : tr("Đăng xuất"))}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="ui-button ui-button-primary text-sm">
                                    {tr("Đăng nhập")}
                                </Link>
                            )
                        )}

                        {/* Mobile hamburger button */}
                        <button
                            type="button"
                            className="flex md:hidden rounded-xl border border-border p-2 text-text-secondary hover:bg-surface-muted"
                            aria-label={tr("Menu")}
                            onClick={() => setMobileNavOpen(!mobileNavOpen)}
                        >
                            <Icon name={mobileNavOpen ? "close" : "menu"} size={20} />
                        </button>
                    </div>
                </div>

                {/* MOBILE NAV ACCORDION */}
                {mobileNavOpen && (
                    <div className="border-t border-border px-4 py-3 md:hidden space-y-1 bg-white">
                        <NavLink to="/" end className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                            {tr("Trang chủ")}
                        </NavLink>
                        <NavLink to="/campaigns" className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                            {tr("Chiến dịch")}
                        </NavLink>
                        <NavLink to="/organizations" className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                            {tr("Tổ chức")}
                        </NavLink>
                        {user && (
                            <>
                                <NavLink to="/manage/campaigns" className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                                    {tr("Chiến dịch của tôi")}
                                </NavLink>
                                <NavLink to="/proposals" className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                                    {tr("Đề xuất")}
                                </NavLink>
                                <NavLink to="/me/settings" className="block rounded-lg px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted">
                                    {tr("Cài đặt cá nhân")}
                                </NavLink>
                            </>
                        )}
                        {isAdmin && (
                            <NavLink to="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light">
                                {tr("Quản trị hệ thống")}
                            </NavLink>
                        )}
                    </div>
                )}

                {/* ADMIN HORIZONTAL SUB-NAVIGATION */}
                {isAdmin && isAdminRoute && (
                    <div className="border-t border-border bg-surface-muted/80 backdrop-blur-xs">
                        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1.5 sm:px-6">
                            {adminItems.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/admin'}
                                    className={({isActive}) => `flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                                    }`}
                                >
                                    <Icon name={item.icon} size={15} />
                                    {renderText(tr(item.label))}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN CONTENT AREA */}
            <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6">
                {renderText(logout.isError && <p role="alert" className="mb-4 text-danger">{renderText(errorMessage(logout.error))}</p>)}
                <Suspense fallback={<LoadingState message={tr("Đang tải trang…")} />}>
                    <Outlet />
                </Suspense>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-border bg-white/90 backdrop-blur-sm py-12 text-sm text-text-secondary">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
                    <div>
                        <Brand />
                        <p className="mt-4 max-w-sm text-xs leading-relaxed">
                            {tr("Cùng sinh viên Bách khoa kết nối tri thức, sẻ chia thời gian và lan tỏa những điều tốt đẹp.")}
                        </p>
                    </div>
                    <div>
                        <p className="mb-3 font-semibold text-text-primary">{tr("Cùng hành động")}</p>
                        <div className="grid gap-2 text-xs">
                            <Link to="/campaigns" className="hover:text-primary transition-colors">{tr("Khám phá chiến dịch")}</Link>
                            <Link to="/organizations" className="hover:text-primary transition-colors">{tr("Cộng đồng tổ chức")}</Link>
                            <Link to={user ? '/proposals/new' : '/login'} className="hover:text-primary transition-colors">{tr("Đăng nhập để bắt đầu")}</Link>
                        </div>
                    </div>
                    <div>
                        <p className="mb-3 font-semibold text-text-primary">DUT Connect</p>
                        <p className="text-xs leading-relaxed">{tr("Đại học Bách khoa")}<br />{tr("Đại học Đà Nẵng")}</p>
                        <p className="mt-3 text-xs text-primary font-semibold">{tr("Kết nối để cống hiến.")}</p>
                    </div>
                </div>
                <div className="mx-auto mt-8 flex max-w-7xl flex-wrap justify-between gap-3 border-t border-border px-4 pt-4 sm:px-6 text-xs text-text-secondary">
                    <small>© {new Date().getFullYear()} DUT Connect</small>
                    <small>{tr("Thời gian · Kỹ năng · Giá trị cộng đồng")}</small>
                </div>
            </footer>
        </div>
    );
}
