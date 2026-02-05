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
import { pb } from '@/api/pb'; // Import PB directly to check validity

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
  const [user, setUser] = useState<api.AuthRecord>(pb.authStore.model);
  const [isValid, setIsValid] = useState(pb.authStore.isValid);

  // Sync the user record with the config state.
  useEffect(() => {
    // Subscribe to changes of the auth record.
    return pb.authStore.onChange((token, model) => {
      setUser(model);
      setIsValid(pb.authStore.isValid);
      console.log("App: Auth State Changed", { isValid: pb.authStore.isValid, hasModel: !!model });
    });
  }, []);

  // Show loading if we have a valid token but no user model yet (SSO refreshing)
  if (isValid && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

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
