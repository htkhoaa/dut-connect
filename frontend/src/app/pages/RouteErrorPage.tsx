import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { tr, useLanguage } from '../../shared/lib/i18n';

export function RouteErrorPage() {
    useLanguage();
    const error = useRouteError();
    const missing = isRouteErrorResponse(error) && error.status === 404;
    return (
        <main className="mx-auto max-w-xl space-y-5 px-6 py-16">
            <h1 className="text-3xl font-bold">
                {tr(missing ? 'Không tìm thấy trang' : 'Chưa thể hiển thị trang này')}
            </h1>
            <p>{tr('Bạn có thể tải lại trang hoặc quay về trang chủ để tiếp tục.')}</p>
            <div className="flex flex-wrap gap-3">
                <button
                    className="ui-button ui-button-primary"
                    onClick={() => window.location.reload()}
                >
                    {tr('Tải lại trang')}
                </button>
                <a className="ui-button ui-button-secondary" href="/">
                    {tr('Về trang chủ')}
                </a>
            </div>
        </main>
    );
}
