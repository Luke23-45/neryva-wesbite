import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

// Import the code-based router
import { router } from './router';

import { GlobalStyles } from '@styles/GlobalStyles';
import { theme } from '@styles/theme';

// Create a new query client
const queryClient = new QueryClient();

// Provision the router with context
router.update({
  context: {
    queryClient,
  },
});

// Main render block
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme.colors.surface,
                color: theme.colors.text.primary,
                borderRadius: theme.radii.md,
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
