export function LoadingState({message = 'Đang tải dữ liệu…'}: {message?: string}) {
    return <div role="status" className="loading-state"><span className="loading-spinner" aria-hidden="true"/><p>{message}</p></div>;
}
