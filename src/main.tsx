import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { router } from './router';
import { GlobalStyles } from '@styles/GlobalStyles';
import { theme } from '@styles/theme';
import { AuthProvider } from '@/Context/AuthContext';
import { OrgProvider } from '@/Context/OrgContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      // Engine errors are typed: retry transient failures only (5xx /
      // network), never 4xx — a 403 must surface immediately, not retry.
      retry: (failureCount, error) => {
        const status = (error as { status?: number }).status;
        if (typeof status === 'number') {
          return status >= 500 && failureCount < 2;
        }
        return failureCount < 2; // network/unknown → bounded retry
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});

router.update({
  context: {
    queryClient,
  },
});

/**
 * Toast styling — matches the agent-studio dark chrome.
 *
 * Why dark? The studio shell is dark (#0b0d12), so a light toast over it
 * would feel foreign. The frosted-glass treatment (backdrop-filter blur
 * 14px) keeps it readable when it pops over varying backgrounds.
 *
 * - Success uses the emerald brand token (#05e3a4) for the leading dot
 * - Error uses the red semantic color (#f87171)
 * - Subtle 1px inner highlight mimics the panel border, so the toast
 *   reads as part of the same family as the modal/dialog surfaces.
 */
const toastStyle: React.CSSProperties = {
  background: 'rgba(15, 17, 22, 0.94)',
  color: '#f5f7fb',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: 500,
  padding: '10px 14px',
  boxShadow:
    '0 16px 48px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.04) inset',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  minWidth: '220px',
  maxWidth: '420px',
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <GlobalStyles />
            <OrgProvider>
        <RouterProvider router={router} />
      </OrgProvider>
            <Toaster
              position="bottom-right"
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: toastStyle,
                success: {
                  iconTheme: { primary: '#05e3a4', secondary: '#0b0d12' },
                },
                error: {
                  iconTheme: { primary: '#f87171', secondary: '#0b0d12' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
