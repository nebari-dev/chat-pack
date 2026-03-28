/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useState
} from 'react';

import type {
  ChatSidebarConfigDetail
} from '@/context/chatsidebar';

import {
  ChatSidebarConfigContext,
} from '@/context/chatsidebar';

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
  // Create the state for managing the sidebar detail.
  //
  // TODO: move this into a URL param on the chat config context?
  const [detail, setDetail] = useState<ChatSidebarConfigDetail | null>(null);

  // Create the sidebar config.
  const sidebarConfig = { detail, setDetail } as const;

  // Return the rendered component.
  return (
    <main className='grow flex flex-col'>
      <Header />
      <ChatSidebarConfigContext value={ sidebarConfig }>
        <div className='min-h-0 grow flex flex-row'>
          <Viewport>
            <ChatOutput />
            <ChatInput />
          </Viewport>
          <ChatSidebar />
        </div>
      </ChatSidebarConfigContext>
    </main>
  );
}
