/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  KnowledgeContext
} from '@/context';

import {
  Knowledge
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
  return (
    <KnowledgeContext value={ { } }>
      <Knowledge />
    </KnowledgeContext>
  );
}
