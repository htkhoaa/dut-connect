import {useLanguage} from "../lib/i18n";
import type {ComponentProps} from 'react';

export function Select({className = '', ...props}: ComponentProps<'select'>) {
    useLanguage();
    return <select className={`w-full rounded-lg border border-border bg-surface px-3 py-2.5 focus:outline-2 focus:outline-offset-2 focus:outline-primary ${className}`} {...props}/>;
}
