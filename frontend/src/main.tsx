import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { router } from './app/router/router';
import {z} from 'zod';
import './index.css';
import {useLanguage} from './shared/lib/i18n';
function configureLanguage(language: 'vi' | 'en') {
  document.documentElement.lang = language;
  z.config(language === 'en' ? z.locales.en() : z.locales.vi());
}
configureLanguage(useLanguage.getState().language);
useLanguage.subscribe(state => configureLanguage(state.language));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Application root element is missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
