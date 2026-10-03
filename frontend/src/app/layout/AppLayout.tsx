import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {Suspense, useEffect, useRef, useState} from 'react';
import {useAuth} from '../../features/auth/store';
import {useInitializeAuth, useLogout} from '../../features/auth/hooks';
import {Button} from '../../shared/components/Button';
import {Icon, type IconName} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';

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
    return <Link to="/" className="brand" aria-label="DUT Connect – Trang chủ"><span className="brand-symbol"><Icon name="leaf" size={25}/></span><span>DUT<span className="font-normal"> Connect</span><small>KẾT NỐI ĐỂ CỐNG HIẾN</small></span></Link>;
}
export function AppLayout() {
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
    const title = [...admin, ...student].find(i => pathname === i.to)?.label || 'Không gian làm việc';
    const links = (values: Item[]) => values.map(i => <NavLink key={i.to} to={i.to} end={i.to === '/admin'} className={({isActive}) => 'sidebar-link ' + (isActive ? 'is-active' : '')}><Icon name={i.icon}/>{i.label}</NavLink>);
    return <div className={privatePage ? 'workspace-shell' : 'public-shell'}>
        <a className="skip-link" href="#main-content">Chuyển đến nội dung</a>
        {privatePage && <>
            {menu && !desktop && <button className="sidebar-overlay" aria-label="Đóng điều hướng" onClick={() => setMenu(false)}/>}
            <aside id="workspace-navigation" ref={sidebar} inert={!desktop && !menu} className={'sidebar ' + (menu ? 'is-open' : '')}>
                <div className="flex items-center justify-between"><Brand/><button className="ui-button ui-button-ghost px-2 lg:hidden" aria-label="Đóng menu" onClick={() => setMenu(false)}><Icon name="close"/></button></div>
                <div className="sidebar-heading">{user.role === 'ADMIN' ? 'QUẢN TRỊ HỆ THỐNG' : 'KHÔNG GIAN CỦA BẠN'}</div>
                <nav aria-label="Điều hướng không gian làm việc">{links(items)}</nav>
                {user.role === 'ADMIN' && <details className="mt-5"><summary className="sidebar-heading cursor-pointer">HOẠT ĐỘNG CÁ NHÂN</summary><nav aria-label="Hoạt động cá nhân">{links(student)}</nav></details>}
                <div className="sidebar-bottom"><div className="rounded-2xl bg-primary-light p-4"><Icon name="spark" className="mb-2 text-primary"/><p className="text-sm font-semibold">Một đóng góp nhỏ.<br/>Một thay đổi lớn.</p><Link to="/campaigns" className="mt-3 inline-flex items-center gap-2 text-sm text-primary">Khám phá chiến dịch <Icon name="arrow" size={16}/></Link></div><Link to="/" className="sidebar-link mt-3"><Icon name="home"/>Về trang chủ</Link></div>
            </aside>
        </>}
        <div className={privatePage ? 'workspace-body' : ''}>
            <header className={privatePage ? 'workspace-header' : 'public-header'}>
                <div className="header-content">
                    {privatePage ? <div className="flex min-w-0 items-center gap-3"><button ref={menuButton} className="ui-button ui-button-ghost px-2 lg:hidden" aria-label="Mở menu" aria-expanded={menu} aria-controls="workspace-navigation" onClick={() => setMenu(!menu)}><Icon name="menu"/></button><div><p className="text-xs text-text-secondary">DUT Connect / {user.role === 'ADMIN' ? 'Quản trị' : 'Cá nhân'}</p><p className="font-semibold">{title}</p></div></div> : <Brand/>}
                    {!privatePage && <nav className="public-nav" aria-label="Điều hướng chính"><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/campaigns">Chiến dịch</NavLink><NavLink to="/organizations">Tổ chức</NavLink></nav>}
                    <div className="header-actions">{initialized && (user ? <><Link className="user-chip" to={user.role === 'ADMIN' ? '/admin' : '/me/profile'}><span className="avatar">{user.fullName.slice(0, 1).toUpperCase()}</span><span className="hidden max-w-44 truncate sm:block">{user.fullName}<small>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên DUT'}</small></span></Link><Button variant="ghost" disabled={logout.isPending} onClick={() => logout.mutate()} aria-label="Đăng xuất"><Icon name="logout"/><span className="hidden sm:inline">{logout.isPending ? 'Đang thoát…' : 'Đăng xuất'}</span></Button></> : <><Link className="hidden text-sm font-semibold sm:inline" to="/login">Đăng nhập</Link><Link className="button-link" to="/register">Tham gia ngay <Icon name="arrow" size={16}/></Link></>)}</div>
                </div>
                {!privatePage && <nav className="mobile-public-nav" aria-label="Điều hướng trên điện thoại"><NavLink to="/" end>Trang chủ</NavLink><NavLink to="/campaigns">Chiến dịch</NavLink><NavLink to="/organizations">Tổ chức</NavLink><Link to={user ? '/me/profile' : '/login'}>{user ? 'Cá nhân' : 'Đăng nhập'}</Link></nav>}
            </header>
            <main id="main-content" className={privatePage ? 'workspace-content' : 'public-content'}>
                {logout.isError && <p role="alert" className="mb-4 text-danger">{errorMessage(logout.error)}</p>}
                <Suspense fallback={<LoadingState message="Đang tải trang…"/>}><Outlet/></Suspense>
            </main>
            {!privatePage && <footer className="public-footer"><div className="footer-inner"><div><Brand/><p className="mt-4 max-w-sm">Cùng sinh viên Bách khoa kết nối tri thức, sẻ chia thời gian và lan tỏa những điều tốt đẹp.</p></div><div><p className="mb-4 font-semibold text-text-primary">Cùng hành động</p><div className="grid gap-3"><Link to="/campaigns">Khám phá chiến dịch</Link><Link to="/organizations">Cộng đồng tổ chức</Link><Link to={user ? '/proposals/new' : '/register'}>Bắt đầu hành trình</Link></div></div><div><p className="mb-4 font-semibold text-text-primary">DUT Connect</p><p>Đại học Bách khoa<br/>Đại học Đà Nẵng</p><p className="mt-3 text-xs">Kết nối để cống hiến.</p></div></div><p className="photo-credits">Ảnh hoạt động: <a href="https://dut.udn.vn/TrangSinhvien/Tintuc/id/12281" target="_blank" rel="noreferrer">BK START</a> · <a href="https://dut.udn.vn/TrangSinhvien/Tintuc/id/12255" target="_blank" rel="noreferrer">Giao lưu công nghệ DUT</a>. Ảnh tư liệu không đại diện cho từng chiến dịch mẫu.</p><div className="footer-bottom"><small>© {new Date().getFullYear()} DUT Connect</small><small>Thời gian · Kỹ năng · Giá trị cộng đồng</small></div></footer>}
        </div>
    </div>;
}
