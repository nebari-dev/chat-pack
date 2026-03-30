/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useQuery
} from '@tanstack/react-query';

import type {
  ReactNode
} from 'react';

import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup
} from '@/components/ui/resizable';

import {
  useChatConfig
} from '@/context';

import {
  threadMessagesQuery
} from '@/queries';

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
  SidebarPanel
} from './sidebarpanel';

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
  // Fetch the thread and detail id from the chat config.
  const { thread, detailId } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the detail target message from the thread.
  const { data: message } = useQuery({
    ...query,
    select: msgs => (
      detailId ? (msgs ?? []).find(msg => msg.id === detailId) : undefined
    )
  });

  // Render the sidebar panel if we have a valid detail message.
  const sidebarPanel = (
    message !== undefined && (
      message.role === 'reasoning' ||
      message.role === 'assistant'
    ) ? <SidebarPanel message={ message } /> : null
  );

  // Create the extra sidebar content.
  const content = (
    sidebarPanel ?
    <>
      <ResizableHandle />
      <ResizablePanel>
        { sidebarPanel }
      </ResizablePanel>
    </>
    : null
  );

  // Return the rendered component.
  return (
    <main className='grow flex flex-col'>
      <Header />
      <div className='grow min-h-0'>
        <ResizablePanelGroup>
          <ResizablePanel>
            <Viewport>
              <ChatOutput />
              <ChatInput />
            </Viewport>
          </ResizablePanel>
          { content }
        </ResizablePanelGroup>
      </div>
    </main>
  );
}
