import type {ReactNode} from 'react';

export function Table({caption, children}: {caption: string; children: ReactNode}) {
    return <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm"><caption className="sr-only">{caption}</caption>{children}</table>
    </div>;
}
