/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ChakraProvider, createSystem, defaultConfig
} from '@chakra-ui/react';

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


// Create a default Chakra system. TODO - define our own for styling.
const system = createSystem(defaultConfig, { preflight: false });


// Render the app into the root element.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={ system }>
      <QueryClientProvider client={ client }>
        <RouterProvider router={ router } />
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>
);
