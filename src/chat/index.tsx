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
      <Viewport>
        <ChatOutput />
        <ChatInput />
      </Viewport>
    </main>
  );
}
