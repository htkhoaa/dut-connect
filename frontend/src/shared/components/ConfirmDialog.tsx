import {Dialog} from './Dialog';
import {Button} from './Button';

export function ConfirmDialog({open, title, message, confirmLabel, onConfirm, onClose, busy = false}: {
    open: boolean; title: string; message: string; confirmLabel: string;
    onConfirm: () => void; onClose: () => void; busy?: boolean;
}) {
    return <Dialog open={open} title={title} onClose={onClose} busy={busy}>
        <p className="mb-6 text-text-secondary">{message}</p>
        <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" autoFocus disabled={busy} onClick={onClose}>Hủy</Button>
            <Button disabled={busy} onClick={onConfirm}>{busy ? 'Vui lòng đợi…' : confirmLabel}</Button>
        </div>
    </Dialog>;
}
