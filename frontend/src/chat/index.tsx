/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery } from '@tanstack/react-query';

import type { ReactNode } from 'react';

import { useChatConfig } from '@/context';

import { threadMessagesQuery } from '@/queries';
import { ChatInput } from './chatinput';
import { ChatOutput } from './chatoutput';
import { Header } from './header';
import { SidebarPanel } from './sidebarpanel';
import { ToolsPanel } from './toolspanel';

import { Viewport } from './viewport';

/**
 * A component that renders the chat panel.
 *
 * This component must be wrapped in a `ChatConfigContext`.
 */
export function Chat(): ReactNode {
  // Fetch the thread, detail id, and tools panel state from the chat config.
  const { thread, detailId, showTools } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the detail target message from the thread.
  const { data: message } = useQuery({
    ...query,
    select: (msgs) =>
      detailId ? (msgs ?? []).find((msg) => msg.id === detailId) : undefined,
  });

  // Determine the right sidebar panel to render.
  //
  // The tools panel takes precedence over the message detail panel.
  let sidebarPanel: ReactNode = null;
  if (showTools) {
    sidebarPanel = <ToolsPanel />;
  } else if (
    message !== undefined &&
    (message.role === 'reasoning' || message.role === 'assistant')
  ) {
    sidebarPanel = <SidebarPanel message={message} />;
  }

  // Return the rendered component.
  //
  // The chat viewport always fills the available space and the sidebar
  // panel, when present, sits beside it at a fixed width. Keeping the
  // viewport in the same tree position avoids remounting the chat (and
  // losing in-progress input) when the sidebar is toggled.
  return (
    <main className="grow min-w-0 flex flex-col">
      <Header />
      <div className="grow min-h-0 min-w-0 flex flex-row">
        <div className="grow min-w-0">
          <Viewport>
            <ChatOutput />
            <ChatInput />
          </Viewport>
        </div>
        {sidebarPanel ? (
          <aside className="w-96 shrink-0 overflow-hidden border-l border-bd-neutral-default">
            {sidebarPanel}
          </aside>
        ) : null}
      </div>
    </main>
  );
}
