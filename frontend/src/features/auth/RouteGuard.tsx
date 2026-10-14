import {useLanguage, tr} from "../../shared/lib/i18n";
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from './store';

export function RouteGuard({admin = false}: { admin?: boolean }) {
    useLanguage();
    const {initialized, user} = useAuth();
    const location = useLocation();
    if (!initialized) return <p role="status">{tr("Đang khôi phục phiên đăng nhập…")}</p>;
    if (!user) return <Navigate to="/login" replace state={{from: location.pathname + location.search}}/>;
    if (admin && user.role !== 'ADMIN') return <div role="alert"><h1>{tr("Không có quyền truy cập")}</h1><p>{tr("Trang này dành cho quản trị viên.")}</p></div>;
    return <Outlet/>;
}
