import {Button} from './Button';

export function Pagination({page, totalPages, hasPrevious, hasNext, onPageChange}: {
    page: number; totalPages: number; hasPrevious: boolean; hasNext: boolean; onPageChange: (page: number) => void;
}) {
    return <nav aria-label="Phân trang" className="mt-7 flex flex-wrap items-center justify-center gap-4">
        <Button variant="secondary" disabled={!hasPrevious} onClick={() => onPageChange(page - 1)}>Trang trước</Button>
        <span className="text-sm text-text-secondary" aria-live="polite">Trang {page + 1} / {Math.max(1, totalPages)}</span>
        <Button variant="secondary" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>Trang sau</Button>
    </nav>;
}
