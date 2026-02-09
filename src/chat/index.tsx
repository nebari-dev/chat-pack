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
} from './chatruntime';

import {
  Header
} from './header';

import {
  Viewport
} from './viewport';


/**
 * A component that renders the chat panel.
 */
export
function Chat(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <ChatRuntimeProvider>
        <Header />
        <Viewport>
          <ChatOutput />
          <ChatInput />
        </Viewport>
      </ChatRuntimeProvider>
    </main>
  );
}
