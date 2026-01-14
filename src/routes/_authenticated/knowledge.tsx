/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import type {
  KnowledgeConfig
} from '@/knowledge';

import {
  Knowledge, KnowledgeConfigProvider
} from '@/knowledge';


/**
 * The route for the `/knowledge` endpoint.
 */
export
const Route = createFileRoute('/_authenticated/knowledge')({
  component: RouteComponent
});


/**
 * The component that renders the `/knowledge` route.
 */
function RouteComponent() {
  // Create the knowledge config.
  const config: KnowledgeConfig = {};

  // Return the rendered component.
  return (
    <KnowledgeConfigProvider value={ config }>
      <Knowledge />
    </KnowledgeConfigProvider>
  );
}
