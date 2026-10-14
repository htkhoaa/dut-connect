import {useLanguage, renderText} from "../lib/i18n";
import type {ReactNode} from 'react';
export function PageHeader({eyebrow, title, description, actions}: {eyebrow?: string; title: string; description?: string; actions?: ReactNode}) {
    useLanguage();
    return <div className="page-heading"><div>{renderText(eyebrow && <p className="eyebrow text-primary">{renderText(eyebrow)}</p>)}<h1>{renderText(title)}</h1>{renderText(description && <p className="mt-3 max-w-2xl text-text-secondary">{renderText(description)}</p>)}</div>{renderText(actions && <div className="flex flex-wrap gap-3">{renderText(actions)}</div>)}</div>;
}
