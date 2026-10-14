import {useLanguage, tr, renderText} from "../lib/i18n";
export function LoadingState({message = tr("Đang tải dữ liệu…")}: {message?: string}) {
    useLanguage();
    return <div role="status" className="loading-state"><span className="loading-spinner" aria-hidden="true"/><p>{renderText(message)}</p></div>;
}
