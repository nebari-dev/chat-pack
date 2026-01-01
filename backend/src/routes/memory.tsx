/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';


export
const Route = createFileRoute('/memory')({
  component: RouteComponent
});


function RouteComponent() {
  return <div>Hello "/memory"!</div>;
}
