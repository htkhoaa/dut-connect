import {useLanguage, renderText} from "../lib/i18n";
import type {ReactNode} from 'react';

export function Table({caption, children}: {caption: string; children: ReactNode}) {
    useLanguage();
    return <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm"><caption className="sr-only">{renderText(caption)}</caption>{renderText(children)}</table>
    </div>;
}
