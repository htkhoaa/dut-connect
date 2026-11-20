import type { ReactNode } from 'react';
import { Select } from './Select';
import { tr, useLanguage } from '../lib/i18n';

export interface DropdownOption<T extends string = string> {
    value: T;
    label: string | ReactNode;
}
interface FilterDropdownProps<T extends string = string> {
    value: T;
    onChange: (value: T) => void;
    options: DropdownOption<T>[];
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
}

// Native selects support Escape, arrow keys and keyboard search.
export function FilterDropdown<T extends string = string>({
    value,
    onChange,
    options,
    placeholder = 'Chọn…',
    ariaLabel,
    className = '',
}: FilterDropdownProps<T>) {
    useLanguage();
    const firstLabel = options[0]?.label;
    return (
        <Select
            value={value}
            onChange={(event) => onChange(event.target.value as T)}
            aria-label={
                ariaLabel || (typeof firstLabel === 'string' ? tr(firstLabel) : tr(placeholder))
            }
            className={className}
        >
            {!options.some((option) => option.value === value) && (
                <option value={value}>{tr(placeholder)}</option>
            )}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {typeof option.label === 'string' ? tr(option.label) : option.label}
                </option>
            ))}
        </Select>
    );
}
