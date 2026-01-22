/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  ChatInput
} from './chatinput';

import {
  ChatOutput
} from './chatoutput';

import {
  ChatRuntimeProvider
} from './chatruntimeprovider';

import {
  Header
} from './header';


/**
 * A component that renders the chat panel.
 */
export
function Chat(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <Header />
      <div className='px-4 grow min-h-0 flex flex-col gap-6 overflow-y-auto'>
        <ChatRuntimeProvider>
          <ChatOutput />
          <ChatInput />
        </ChatRuntimeProvider>
      </div>
    </main>
  );
}
