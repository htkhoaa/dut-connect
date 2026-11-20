import { useState } from 'react';
import { Dialog } from './Dialog';
import { ApiImage } from './ApiImage';
import { Button } from './Button';
import { tr, useLanguage } from '../lib/i18n';

export function ImageViewer({
    src,
    caption,
    onClose,
    onPrevious,
    onNext,
    position,
}: {
    src: string;
    caption: string;
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    position?: string;
}) {
    useLanguage();
    const [zoom, setZoom] = useState(100);
    return (
        <Dialog
            open
            title={caption}
            onClose={onClose}
            className="max-w-5xl max-h-[92vh] overflow-y-auto"
        >
            <div className="mb-3 flex flex-wrap items-center gap-2">
                {onPrevious && (
                    <Button variant="secondary" onClick={onPrevious}>
                        {tr('Ảnh trước')}
                    </Button>
                )}
                {onNext && (
                    <Button variant="secondary" onClick={onNext}>
                        {tr('Ảnh tiếp theo')}
                    </Button>
                )}
                <Button
                    variant="secondary"
                    onClick={() => setZoom((v) => Math.max(100, v - 25))}
                    disabled={zoom === 100}
                    aria-label={tr('Thu nhỏ')}
                >
                    −
                </Button>
                <output aria-live="polite" className="min-w-12 text-center text-sm">
                    {zoom}%
                </output>
                <Button
                    variant="secondary"
                    onClick={() => setZoom((v) => Math.min(300, v + 25))}
                    disabled={zoom === 300}
                    aria-label={tr('Phóng to')}
                >
                    +
                </Button>
                <Button variant="secondary" onClick={() => setZoom(100)}>
                    {tr('Vừa khung')}
                </Button>
                {position && (
                    <span className="ml-auto text-sm text-text-secondary">{position}</span>
                )}
            </div>
            <div
                className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-surface-muted"
                tabIndex={0}
                aria-label={tr('Vùng xem ảnh, cuộn để di chuyển khi phóng to')}
            >
                <div style={{ width: `${zoom}%` }}>
                    <ApiImage src={src} alt={caption} className="block h-auto w-full" />
                </div>
            </div>
            <p className="mt-3 text-xs text-text-secondary">
                {tr('Cuộn ngang hoặc dọc để di chuyển ảnh khi phóng to. Nhấn Esc để đóng.')}
            </p>
        </Dialog>
    );
}
