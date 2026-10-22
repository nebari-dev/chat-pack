/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * The route definition for `/`.
 *
 * There is no separate home page: the sidebar already lists every agent and
 * conversation, so the app opens straight into a new chat. The `/chat` route
 * picks the default agent.
 */
export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    throw redirect({ to: '/chat', replace: true });
  },
});
