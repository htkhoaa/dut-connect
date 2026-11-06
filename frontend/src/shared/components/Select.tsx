import {useLanguage} from "../lib/i18n";
import type {ComponentProps} from 'react';

export function Select({className = '', children, ...props}: ComponentProps<'select'>) {
    useLanguage();
    return (
        <div className="relative w-full">
            <select
                className={`w-full appearance-none rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 pr-10 text-sm font-medium text-text-primary shadow-2xs transition-all hover:border-primary-muted hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${className}`}
                {...props}
            >
                {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
        </div>
    );
}
