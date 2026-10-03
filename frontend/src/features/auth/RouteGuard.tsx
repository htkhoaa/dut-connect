import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from './store';

export function RouteGuard({admin = false}: { admin?: boolean }) {
    const {initialized, user} = useAuth();
    const location = useLocation();
    if (!initialized) return <p role="status">Đang khôi phục phiên đăng nhập…</p>;
    if (!user) return <Navigate to="/login" replace state={{from: location.pathname + location.search}}/>;
    if (admin && user.role !== 'ADMIN') return <div role="alert"><h1>Không có quyền truy cập</h1><p>Trang này dành cho quản trị viên.</p></div>;
    return <Outlet/>;
}
