/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  StrictMode, useEffect, useState
} from 'react';

import {
  createRoot
} from 'react-dom/client';

import {
  RouterProvider, createRouter
} from '@tanstack/react-router';

import {
  QueryClient, QueryClientProvider
} from '@tanstack/react-query';

import * as api from '@/api';

import type {
  AuthConfig
} from '@/auth';

import {
  AuthConfigProvider
} from '@/auth';

import {
  routeTree
} from './routeTree.gen';

import 'katex/dist/katex.min.css';

import './main.css';


// Create the singleton query client.
const client = new QueryClient();


// Create the main router object.
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  context: { client }
});


// Register the router for type safety.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}


// A react component that bootstraps the application.
function App() {
  // Create the state to track the user record.
  const [user, setUser] = useState<api.AuthRecord>(null);

  // Sync the user record with the config state.
  useEffect(() => {
    // Ensure the user is synced with the current auth state.
    setUser(api.getUser());

    // Subscribe to changes of the auth record.
    return api.onUserChange(record => { setUser(record); });
  }, []);

  // Create the auth config object.
  const auth: AuthConfig = { user };

  // Return the rendered component.
  return (
    <StrictMode>
      <AuthConfigProvider value={ auth }>
        <QueryClientProvider client={ client }>
          <RouterProvider router={ router } />
        </QueryClientProvider>
      </AuthConfigProvider>
    </StrictMode>
  );
}


// Render the app into the root element.
createRoot(document.getElementById('root')!).render(<App />);
