import {useLanguage, renderText} from "../../shared/lib/i18n";
import {QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {queryClient} from '../../shared/api/queryClient';
import {ToastProvider} from '../../shared/components/ToastProvider';

export function AppProviders({children}: { children: ReactNode }) {
    useLanguage();
    return <QueryClientProvider client={queryClient}><ToastProvider>{renderText(children)}</ToastProvider></QueryClientProvider>;
}
