import {useLanguage, renderText} from "../lib/i18n";
import type {ReactNode} from 'react';

export type BadgeTone = 'success' | 'danger' | 'neutral';
const tones: Record<BadgeTone, string> = {
    success: 'bg-primary-light text-success', danger: 'bg-surface-muted text-danger', neutral: 'bg-surface-muted text-text-secondary',
};
export function Badge({children, tone = 'neutral'}: {children: ReactNode; tone?: BadgeTone}) {
    useLanguage();
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current"/>{renderText(children)}</span>;
}
