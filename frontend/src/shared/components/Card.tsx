import {useLanguage, renderText} from "../lib/i18n";
import type {ReactNode} from 'react';

export function Card({children, className = ''}: { children: ReactNode; className?: string }) {
    useLanguage();
    return <div className={'ui-card ' + className}>{renderText(children)}</div>;
}
