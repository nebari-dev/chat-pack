/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/hooks/themecontext';
import { notifyError } from '@/lib/notifications';

import { routeTree } from './routeTree.gen';

import 'katex/dist/katex.min.css';

import './main.css';

// Create the singleton query client.
//
// All query and mutation failures are funneled through `notifyError`, so
// every async data path surfaces a user-facing toast without per-call wiring.
const client = new QueryClient({
  queryCache: new QueryCache({ onError: (error) => notifyError(error) }),
  mutationCache: new MutationCache({ onError: (error) => notifyError(error) }),
});

// Create the main router object.
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ErrorFallback,
  context: { client },
});

// Register the router for type safety.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// A react component that bootstraps the application.
function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={client}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// Render the app into the root element.
createRoot(document.getElementById('root')!).render(<App />);
