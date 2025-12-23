/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ChartLine, Database, MemoryStick, MessageSquarePlus, MessagesSquare
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  LinkCard
} from './linkcard';


/**
 * A React component that renders the explorer links for the home page.
 */
export
function Explorer(): ReactNode {
  return (
    <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4'>
      <LinkCard
        to='/chat'
        title='Chat'
        description='Chat with your agents, teams, and workflows'
        icon={ <MessageSquarePlus size={ 16 } /> } />
      <LinkCard
        to='/sessions'
        title='Sessions'
        description='View and manage agent, team, and workflow sessions'
        icon={ <MessagesSquare size={ 16 } /> } />
      <LinkCard
        to='/knowledge'
        title='Knowledge'
        description='View and manage knowledge bases'
        icon={ <Database size={ 16 } /> } />
      <LinkCard
        to='/memories'
        title='Memories'
        description='View and manage agentic memories'
        icon={ <MemoryStick size={ 16 } /> } />
      <LinkCard
        to='/metrics'
        title='Metrics'
        description='Monitor the usage of agents, teams, and workflows'
        icon={ <ChartLine size={ 16 } /> } />
    </div>
  );
}
