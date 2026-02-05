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
  agnoAPI
} from '@/agno';

import {
  APIProvider
} from '@/api';

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
  context: { client, API: agnoAPI }
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
      <APIProvider value={ agnoAPI }>
        <QueryClientProvider client={ client }>
          <RouterProvider router={ router } />
        </QueryClientProvider>
      </APIProvider>
    </StrictMode>
  );
}


// Render the app into the root element.
createRoot(document.getElementById('root')!).render(<App />);
