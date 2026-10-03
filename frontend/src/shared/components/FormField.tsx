import {cloneElement, isValidElement, type ReactNode, type ReactElement} from 'react';

export function FormField({label, id, error, children}: {
    label: string;
    id: string;
    error?: string;
    children: ReactNode
}) {
    return <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        {isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-invalid'?: boolean; 'aria-describedby'?: string }>, {
            'aria-invalid': !!error, 'aria-describedby': error ? id + '-error' : undefined,
        }) : children}
        {error && <p id={id + '-error'} className="text-sm text-danger" role="alert">{error}</p>}
    </div>;
}
