import {useEffect, useId, useRef, type ReactNode} from 'react';

export function Dialog({open, title, children, onClose, busy = false}: {
    open: boolean; title: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    useEffect(() => {
        const dialog = ref.current;
        if (open && dialog && !dialog.open) dialog.showModal();
        if (!open && dialog?.open) dialog.close();
    }, [open]);
    return <dialog ref={ref} aria-labelledby={titleId} aria-busy={busy}
                   className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-6 text-text-primary backdrop:bg-black/40"
                   onCancel={(event) => {event.preventDefault(); if (!busy) onClose();}}
                   onClick={(event) => {if (event.target === event.currentTarget && !busy) {
                       const bounds = event.currentTarget.getBoundingClientRect();
                       if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
                   }}}>
        <h2 id={titleId} className="mb-4 text-xl font-semibold">{title}</h2>{children}
    </dialog>;
}
