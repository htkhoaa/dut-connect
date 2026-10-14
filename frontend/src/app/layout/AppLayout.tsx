import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {Suspense, useEffect, useRef, useState} from 'react';
import {useAuth} from '../../features/auth/store';
import {useInitializeAuth, useLogout} from '../../features/auth/hooks';
import {Button} from '../../shared/components/Button';
import {Icon, type IconName} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';
import {UserAvatar} from '../../features/profile/avatar';
import {LanguageSwitch} from '../../shared/components/LanguageSwitch';

type Item = {to: string; label: string; icon: IconName};
const student: Item[] = [
    {to: '/me/profile', label: 'Hồ sơ & kỹ năng', icon: 'users'},
    {to: '/me/applications', label: 'Đăng ký tình nguyện', icon: 'heart'},
    {to: '/me/tasks', label: 'Nhiệm vụ của tôi', icon: 'check'},
    {to: '/me/history', label: 'Lịch sử đóng góp', icon: 'calendar'},
    {to: '/me/donations', label: 'Khoản ủng hộ', icon: 'heart'},
    {to: '/me/organizations', label: 'Tổ chức của tôi', icon: 'building'},
    {to: '/proposals', label: 'Đề xuất chiến dịch', icon: 'file'},
    {to: '/manage/campaigns', label: 'Quản lý chiến dịch', icon: 'grid'},
];
const admin: Item[] = [
    {to: '/admin', label: 'Tổng quan', icon: 'grid'},
    {to: '/admin/proposals', label: 'Duyệt đề xuất', icon: 'file'},
    {to: '/admin/organizations', label: 'Xác minh tổ chức', icon: 'shield'},
    {to: '/admin/expenses', label: 'Duyệt chi phí', icon: 'file'},
    {to: '/admin/campaigns', label: 'Tất cả chiến dịch', icon: 'heart'},
    {to: '/admin/users', label: 'Người dùng', icon: 'users'},
    {to: '/admin/categories', label: 'Danh mục', icon: 'grid'},
];
function Brand() {
    useLanguage();
    return <Link to="/" className="brand" aria-label={tr("DUT Connect – Trang chủ")}><img className="brand-logo" src="/images/dut-logo-51.png" alt={tr("Logo kỷ niệm 51 năm Đại học Bách khoa Đà Nẵng")}/><span>DUT<span className="font-normal"> Connect</span><small>{tr("KẾT NỐI ĐỂ CỐNG HIẾN")}</small></span></Link>;
}
export function AppLayout() {
    useLanguage();
    useInitializeAuth();
    const {user, initialized} = useAuth();
    const logout = useLogout();
    const {pathname} = useLocation();
    const [menu, setMenu] = useState(false);
    const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
    const sidebar = useRef<HTMLElement>(null);
    const menuButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {setMenu(false);}, [pathname]);
    useEffect(() => {
        const query = window.matchMedia('(min-width: 1024px)');
        const update = () => setDesktop(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (!menu || desktop) return;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();
        const trap = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;
            const elements = [...(sidebar.current?.querySelectorAll<HTMLElement>('a,button,summary') || [])].filter(el => el.getClientRects().length);
            const first = elements[0], last = elements.at(-1);
            if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
            else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
        };
        window.addEventListener('keydown', trap);
        return () => {document.body.style.overflow = overflow; window.removeEventListener('keydown', trap); menuButton.current?.focus();};
    }, [menu, desktop]);
    useEffect(() => {const close = (event: KeyboardEvent) => {if (event.key === 'Escape') setMenu(false);}; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);}, []);
    const privatePage = !!user && (/^\/(me|manage|admin|proposals|donations|payment|dev)(\/|$)/.test(pathname) || pathname === '/organizations/new');
    const items = user?.role === 'ADMIN' ? admin : student;
    const title = [...admin, ...student].find(i => pathname === i.to)?.label || tr("Không gian làm việc");
    const links = (values: Item[]) => values.map(i => <NavLink key={i.to} to={i.to} end={i.to === '/admin'} className={({isActive}) => 'sidebar-link ' + (isActive ? 'is-active' : '')}><Icon name={i.icon}/>{renderText(i.label)}</NavLink>);
    return <div className={privatePage ? 'workspace-shell' : 'public-shell'}>
        <a className="skip-link" href="#main-content">{tr("Chuyển đến nội dung")}</a>
        {renderText(privatePage && <>
            {menu && !desktop && <button className="sidebar-overlay" aria-label={tr("Đóng điều hướng")} onClick={() => setMenu(false)}/>}
            <aside id="workspace-navigation" ref={sidebar} inert={!desktop && !menu} className={'sidebar ' + (menu ? 'is-open' : '')}>
                <div className="flex items-center justify-between"><Brand/><button className="ui-button ui-button-ghost px-2 lg:hidden" aria-label={tr("Đóng menu")} onClick={() => setMenu(false)}><Icon name="close"/></button></div>
                <div className="sidebar-heading">{renderText(user.role === 'ADMIN' ? 'QUẢN TRỊ HỆ THỐNG' : tr("KHÔNG GIAN CỦA BẠN"))}</div>
                <nav aria-label={tr("Điều hướng không gian làm việc")}>{renderText(links(items))}</nav>
                {renderText(user.role === 'ADMIN' && <details className="mt-5"><summary className="sidebar-heading cursor-pointer">{tr("HOẠT ĐỘNG CÁ NHÂN")}</summary><nav aria-label={tr("Hoạt động cá nhân")}>{renderText(links(student))}</nav></details>)}
                <div className="sidebar-bottom"><div className="rounded-2xl bg-primary-light p-4"><Icon name="spark" className="mb-2 text-primary"/><p className="text-sm font-semibold">{tr("Một đóng góp nhỏ.")}<br/>{tr("Một thay đổi lớn.")}</p><Link to="/campaigns" className="mt-3 inline-flex items-center gap-2 text-sm text-primary">{tr("Khám phá chiến dịch")}<Icon name="arrow" size={16}/></Link></div><Link to="/" className="sidebar-link mt-3"><Icon name="home"/>{tr("Về trang chủ")}</Link></div>
            </aside>
        </>)}
        <div className={privatePage ? 'workspace-body' : ''}>
            <header className={privatePage ? 'workspace-header' : 'public-header'}>
                <div className="header-content">
                    <LanguageSwitch/>
                    {renderText(privatePage ? <div className="flex min-w-0 items-center gap-3"><button ref={menuButton} className="ui-button ui-button-ghost px-2 lg:hidden" aria-label={tr("Mở menu")} aria-expanded={menu} aria-controls="workspace-navigation" onClick={() => setMenu(!menu)}><Icon name="menu"/></button><div><p className="text-xs text-text-secondary">DUT Connect / {renderText(user.role === 'ADMIN' ? tr("Quản trị") : tr("Cá nhân"))}</p><p className="font-semibold">{renderText(title)}</p></div></div> : <Brand/>)}
                    {renderText(!privatePage && <nav className="public-nav" aria-label={tr("Điều hướng chính")}><NavLink to="/" end>{tr("Trang chủ")}</NavLink><NavLink to="/campaigns">{tr("Chiến dịch")}</NavLink><NavLink to="/organizations">{tr("Tổ chức")}</NavLink></nav>)}
                    <div className="header-actions">{renderText(initialized && (user ? <><Link className="user-chip" to={user.role === 'ADMIN' ? '/admin' : '/me/profile'}><UserAvatar/><span className="hidden max-w-44 truncate sm:block">{renderText(user.fullName)}<small>{renderText(user.role === 'ADMIN' ? tr("Quản trị viên") : tr("Thành viên DUT"))}</small></span></Link><Button variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()} aria-label={tr("Đăng xuất")}><Icon name="logout"/><span className="hidden sm:inline">{renderText(logout.isPending ? tr("Đang thoát…") : tr("Đăng xuất"))}</span></Button></> : <><Link className="hidden text-sm font-semibold sm:inline" to="/login">{tr("Đăng nhập")}</Link><Link className="button-link" to="/register">Tham gia ngay <Icon name="arrow" size={16}/></Link></>))}</div>
                </div>
                {renderText(!privatePage && <nav className="mobile-public-nav" aria-label={tr("Điều hướng trên điện thoại")}><NavLink to="/" end>{tr("Trang chủ")}</NavLink><NavLink to="/campaigns">{tr("Chiến dịch")}</NavLink><NavLink to="/organizations">{tr("Tổ chức")}</NavLink><Link to={user ? '/me/profile' : '/login'}>{renderText(user ? tr("Cá nhân") : tr("Đăng nhập"))}</Link></nav>)}
            </header>
            <main id="main-content" className={privatePage ? 'workspace-content' : 'public-content'}>
                {renderText(logout.isError && <p role="alert" className="mb-4 text-danger">{renderText(errorMessage(logout.error))}</p>)}
                <Suspense fallback={<LoadingState message={tr("Đang tải trang…")}/>}><Outlet/></Suspense>
            </main>
            {renderText(!privatePage && <footer className="public-footer"><div className="footer-inner"><div><Brand/><p className="mt-4 max-w-sm">{tr("Cùng sinh viên Bách khoa kết nối tri thức, sẻ chia thời gian và lan tỏa những điều tốt đẹp.")}</p></div><div><p className="mb-4 font-semibold text-text-primary">{tr("Cùng hành động")}</p><div className="grid gap-3"><Link to="/campaigns">{tr("Khám phá chiến dịch")}</Link><Link to="/organizations">{tr("Cộng đồng tổ chức")}</Link><Link to={user ? '/proposals/new' : '/register'}>{tr("Bắt đầu hành trình")}</Link></div></div><div><p className="mb-4 font-semibold text-text-primary">DUT Connect</p><p>{tr("Đại học Bách khoa")}<br/>{tr("Đại học Đà Nẵng")}</p><p className="mt-3 text-xs">{tr("Kết nối để cống hiến.")}</p></div></div><div className="footer-bottom"><small>© {renderText(new Date().getFullYear())} DUT Connect</small><small>{tr("Thời gian · Kỹ năng · Giá trị cộng đồng")}</small></div></footer>)}
        </div>
    </div>;
}
