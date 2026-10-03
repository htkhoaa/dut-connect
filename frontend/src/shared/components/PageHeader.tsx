import type {ReactNode} from 'react';
export function PageHeader({eyebrow, title, description, actions}: {eyebrow?: string; title: string; description?: string; actions?: ReactNode}) {
    return <div className="page-heading"><div>{eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="mt-3 max-w-2xl text-text-secondary">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-3">{actions}</div>}</div>;
}
