import {useLanguage, renderText, tr} from "../lib/i18n";
import {useEffect, useId, useRef, type ReactNode} from 'react';

export function Dialog({open, title, children, onClose, busy = false, className}: {
    open: boolean; title: string; children: ReactNode; onClose: () => void; busy?: boolean; className?: string;
}) {
    useLanguage();
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => {
        const dialog = ref.current;
        if (open && dialog && !dialog.open) dialog.showModal();
        if (!open && dialog?.open) dialog.close();
    }, [open]);
    return <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy}
                   className={className ? `fixed inset-0 m-auto w-[calc(100%-2rem)] rounded-2xl border border-border bg-surface p-6 text-text-primary backdrop:bg-black/40 ${className}` : "fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-6 text-text-primary backdrop:bg-black/40"}
                   onCancel={(event) => {event.preventDefault(); if (!busy) onClose();}}
                   onClick={(event) => {if (event.target === event.currentTarget && !busy) {
                       const bounds = event.currentTarget.getBoundingClientRect();
                       if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
                   }}}>
        <div className="mb-4 flex items-start justify-between gap-4"><h2 id={titleId} className="text-xl font-semibold">{renderText(title)}</h2>
            <button type="button" disabled={busy} onClick={onClose} aria-label={tr('Đóng hộp thoại')} className="shrink-0 rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface-muted disabled:opacity-50">{tr('Đóng')} ×</button>
        </div>{renderText(children)}
    </dialog>;
}
