/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  StrictMode
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

import {
  routeTree
} from './routeTree.gen';

import './main.css';


// Create the main query client.
const queryClient = new QueryClient();


// Create the main router object.
const router = createRouter({
  routeTree,
  defaultPreload: 'intent'
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
