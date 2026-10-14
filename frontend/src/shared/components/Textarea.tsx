import {useLanguage} from "../lib/i18n";
import type {ComponentProps} from 'react';

export function Textarea({className = '', ...props}: ComponentProps<'textarea'>) {
    useLanguage();
    return <textarea className={`w-full rounded-lg border border-border bg-surface px-3 py-2.5 focus:outline-2 focus:outline-offset-2 focus:outline-primary ${className}`} {...props}/>;
}
