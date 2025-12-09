/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  Memory
} from '@/components/memory';


export
const Route = createFileRoute('/memory')({
  component: RouteComponent
});



function RouteComponent() {
  return <Memory />;
}