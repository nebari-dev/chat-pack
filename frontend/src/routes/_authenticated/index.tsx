/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import { Home } from '@/home';

/**
 * The route definition for the home page.
 */
export const Route = createFileRoute('/_authenticated/')({
  component: RouteComponent,
});

/**
 * A react component that renders the home route.
 */
function RouteComponent(): ReactNode {
  return <Home />;
}
