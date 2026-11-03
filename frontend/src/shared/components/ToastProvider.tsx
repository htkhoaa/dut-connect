import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from 'react';
import {useLanguage, tr} from '../lib/i18n';

type Toast = {id: number; message: string; tone: 'success' | 'error' | 'info'};
type ToastContextValue = {show: (message: string, tone?: Toast['tone']) => void};
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: ReactNode}) {
    useLanguage();
    const [items, setItems] = useState<Toast[]>([]);
    const show = useCallback((message: string, tone: Toast['tone'] = 'info') => {
        const id = Date.now() + Math.random();
        setItems(current => [...current, {id, message, tone}].slice(-4));
        window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 5000);
    }, []);
    const value = useMemo(() => ({show}), [show]);
    return <ToastContext.Provider value={value}>
        {children}
        <div className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
            {items.map(item => <div key={item.id} role={item.tone === 'error' ? 'alert' : 'status'}
                className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${item.tone === 'success' ? 'border-success/30 bg-success/10 text-success' : item.tone === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-border bg-surface text-text'}`}>
                {tr(item.message)}
            </div>)}
        </div>
    </ToastContext.Provider>;
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used inside ToastProvider');
    return context;
}
