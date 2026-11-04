import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from 'react';
import {Icon} from './Icon';
import {Button} from './Button';
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
        <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
            {items.map(item => <div key={item.id} role={item.tone === 'error' ? 'alert' : 'status'}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-2xl ring-1 ring-black/10 ${item.tone === 'success' ? 'border-success/30 text-success' : item.tone === 'error' ? 'border-danger/30 text-danger' : 'border-border text-text'}`}>
                <span className="min-w-0 flex-1">{tr(item.message)}</span>
                <Button type="button" variant="ghost" className="shrink-0 p-1" aria-label={tr("Đóng thông báo")} onClick={() => setItems(current => current.filter(value => value.id !== item.id))}>
                    <Icon name="close" size={16}/>
                </Button>
            </div>)}
        </div>
    </ToastContext.Provider>;
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used inside ToastProvider');
    return context;
}
