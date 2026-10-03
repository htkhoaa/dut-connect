import type {ButtonHTMLAttributes} from 'react';

export function Button({className = '', type = 'button', variant = 'primary', ...props}: ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'ghost' | 'danger'}) {
    return (
        <button
            type={type}
            className={`ui-button ui-button-${variant} ${className}`}
            {...props}
        />
    );
}
