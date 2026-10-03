import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { router } from './app/router/router';
import {z} from 'zod';
import './index.css';
z.config(z.locales.vi());

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
