/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute
} from '@tanstack/react-router';

import {
  cn
} from '@/lib/utils';


export
const Route = createFileRoute('/')({
  component: RouteComponent
});


function RouteComponent() {
  return (
    <div className={cn(
      'flex-auto h-full bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)]',
      'bg-[auto_240px] bg-center bg-no-repeat'
    )}/>
  );
}
