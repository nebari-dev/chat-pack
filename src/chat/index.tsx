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
  ChatSidebar
} from './chatsidebar';

import {
  Header
} from './header';

import {
  Viewport
} from './viewport';


/**
 * A component that renders the chat panel.
 *
 * This component must be wrapped in a `ChatConfigContext`.
 */
export
function Chat(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <Header />
      <div className='min-h-0 grow flex flex-row'>
        <Viewport>
          <ChatOutput />
          <ChatInput />
        </Viewport>
        <ChatSidebar />
      </div>
    </main>
  );
}
