import {useState, useRef, useEffect, type ReactNode} from 'react';
import {Icon} from './Icon';

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

export function FilterDropdown<T extends string = string>({
    value,
    onChange,
    options,
    placeholder = 'Chọn…',
    ariaLabel,
    className = '',
}: FilterDropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className={`relative w-full ${className}`} ref={ref}>
            <button
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-left text-xs sm:text-sm font-medium text-text-primary shadow-2xs transition-all hover:border-primary-muted hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
                <span className="truncate">{displayLabel}</span>
                <Icon
                    name="arrow"
                    size={14}
                    className={`shrink-0 text-text-secondary transition-transform duration-200 rotate-90 ${open ? '-rotate-90 text-primary' : ''}`}
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute left-0 top-full z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95"
                >
                    {options.map(option => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left ${
                                    isSelected
                                        ? 'bg-primary-light text-primary font-bold shadow-2xs'
                                        : 'text-text-primary hover:bg-surface-muted hover:text-primary'
                                }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {isSelected && (
                                    <Icon name="check" size={15} className="text-primary shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
