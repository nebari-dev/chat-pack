/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  getRouteApi
} from '@tanstack/react-router';

import {
  type ReactNode
} from 'react';

import {
  Thread
} from '@/components/assistant-ui/thread';

import {
  AUIProvider
} from './auiprovider';


const routeApi = getRouteApi('/chat');


/**
 * A component that renders the Assistant-UI based Chat panel.
 */
export
function Chat(): ReactNode {
  const { session_id, agent_id } = routeApi.useSearch();

  // TODO handle agent_id and session_id defaults...

  return (
    <AUIProvider
      agent_id={agent_id ?? ''}
      session_id={session_id ?? ''}>
      <Thread />
    </AUIProvider>
  );
}
