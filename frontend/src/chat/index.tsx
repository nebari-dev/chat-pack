/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useChatConfig } from '@/context';

import { ChatInput } from './chatinput';
import { ChatOutput } from './chatoutput';
import { DetailDrawer } from './detaildrawer';
import { EmptyState } from './emptystate';
import { Header } from './header';
import { Viewport } from './viewport';

/**
 * A component that renders the chat panel.
 *
 * This component must be wrapped in a `ChatConfigContext`.
 */
export function Chat(): ReactNode {
  const { thread } = useChatConfig();

  // The drawer overlays the conversation instead of sitting beside it, so
  // the viewport keeps one stable position in the tree and never remounts
  // (which would lose in-progress input) when the drawer toggles.
  return (
    <main className="flex min-w-0 grow flex-col bg-canvas">
      <Header />
      <div className="min-h-0 min-w-0 grow">
        <Viewport>
          {thread ? <ChatOutput /> : <EmptyState />}
          <ChatInput />
        </Viewport>
      </div>
      <DetailDrawer />
    </main>
  );
}
