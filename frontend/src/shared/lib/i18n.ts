import {create} from 'zustand';
import type {ReactNode} from 'react';
import {english} from './translations';

export type Language = 'vi' | 'en';
function initialLanguage(): Language {
    try {return localStorage.getItem('dut-language') === 'en' ? 'en' : 'vi';} catch {return 'vi';}
}
export const useLanguage = create<{language: Language; setLanguage: (language: Language) => void}>(set => ({
    language: initialLanguage(),
    setLanguage: language => {try {localStorage.setItem('dut-language', language);} catch { /* Preference remains in memory. */ }
        document.documentElement.lang = language; set({language});},
}));
export function locale(): string {return useLanguage.getState().language === 'en' ? 'en-GB' : 'vi-VN';}
export function tr(value: string): string {
    if (useLanguage.getState().language === 'vi') return value;
    const translated = english[value] || english[value.trim()];
    return translated ? value.replace(value.trim(), translated) : value;
}
/** UI text only; API request values and user-authored content are never rewritten. */
export function renderText(value: ReactNode): ReactNode {
    return typeof value === 'string' ? tr(value) : Array.isArray(value) ? value.map(renderText) : value;
}
