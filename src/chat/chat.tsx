/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  type ReactNode
} from 'react';

import {
  Thread
} from '@/components/assistant-ui/thread';

import {
  AUIProvider
} from './auiprovider';

import {
  Dashboard
} from './dashboard';

import {
  Header
} from './header';


/**
 * A component that renders the Assistant-UI chat panel.
 */
export
function Chat(): ReactNode {
  return (
    <main className='grow flex flex-row'>
      <div className='p-2 grow bg-bg-neutral-default overflow-auto'>
        <Dashboard />
      </div>
      <div className='flex flex-col w-120 shrink-0 border-l'>
        <Header />
        <div className='grow min-h-0'>
          <AUIProvider>
            <Thread />
          </AUIProvider>
        </div>
      </div>
    </main>
  );
}
