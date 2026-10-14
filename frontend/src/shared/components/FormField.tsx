import {useLanguage, renderText} from "../lib/i18n";
import {cloneElement, isValidElement, type ReactNode, type ReactElement} from 'react';

export function FormField({label, id, error, children}: {
    label: string;
    id: string;
    error?: string;
    children: ReactNode
}) {
    useLanguage();
    return <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-medium">{renderText(label)}</label>
        {renderText(isValidElement(children) ? cloneElement(children as ReactElement<{ 'aria-invalid'?: boolean; 'aria-describedby'?: string }>, {
            'aria-invalid': !!error, 'aria-describedby': error ? id + '-error' : undefined,
        }) : children)}
        {renderText(error && <p id={id + '-error'} className="text-sm text-danger" role="alert">{renderText(error)}</p>)}
    </div>;
}
