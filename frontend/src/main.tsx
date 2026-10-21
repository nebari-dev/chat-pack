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

import { initAuth } from '@/auth';
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { applyBranding, loadAppConfig } from '@/config';
import { ThemeProvider } from '@/hooks/theme-provider';
import { notifyError } from '@/lib/notifications';

import { routeTree } from './routeTree.gen';

import '@fontsource-variable/geist';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import 'katex/dist/katex.min.css';

import './main.css';

/**
 * The localStorage key under which the theme preference is persisted. Kept in
 * sync with the inline bootstrap script in `index.html` that prevents a flash
 * of the wrong theme on initial load.
 */
const THEME_MODE_STORAGE_KEY = 'nebari-chat:themeMode';

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
        <ThemeProvider storageKey={THEME_MODE_STORAGE_KEY}>
          <QueryClientProvider client={client}>
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// Bootstrap the application.
//
// Runtime config is loaded from `/config.json` first so branding can be applied
// (title, favicon, theme tokens) and Keycloak initialized before React mounts.
async function bootstrap() {
  const config = await loadAppConfig();
  applyBranding(config.branding);
  await initAuth(config.keycloak);
  createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap();
