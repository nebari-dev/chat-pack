/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  StrictMode, useEffect
} from 'react';

import {
  createRoot
} from 'react-dom/client';

import {
  RouterProvider, createRouter
} from '@tanstack/react-router';

import {
  AuthProvider, useAuth
} from './login/authconfigprovider'

import {
  QueryClient, QueryClientProvider
} from '@tanstack/react-query';

import {
  routeTree
} from './routeTree.gen';

import './main.css';


// Create the main query client.
const client = new QueryClient();

// Inject auth state into the router context
function App() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

// Create the main router object.
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  context: { 
    client,
    auth: undefined!,
  }
});


// Register the router for type safety.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}


// Render the app into the root element.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={ client }>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
