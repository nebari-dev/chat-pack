/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { useQuery } from '@tanstack/react-query';

import { useNavigate } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useChatConfig } from '@/context';
import { threadMessagesQuery } from '@/queries';

import { ToolDetail } from './tooldetail';
import { ToolsPanel } from './toolspanel';

/**
 * A React component that renders the chat's detail drawer.
 *
 * It shows either the tools panel or the tool calls of one reply. Both are
 * driven by the `showTools` and `detailId` search params, so the drawer state
 * survives reloads and can be linked to. It is non-modal: the conversation
 * stays readable and scrollable beside it.
 */
export function DetailDrawer(): ReactNode {
  const { thread, detailId, showTools } = useChatConfig();
  const navigate = useNavigate();

  // Resolve the reply the detail id points at, if any.
  const { data: message } = useQuery({
    ...threadMessagesQuery(thread?.id),
    select: (msgs) =>
      detailId
        ? (msgs ?? []).find(
            (msg): msg is agui.AssistantMessage =>
              msg.id === detailId && msg.role === 'assistant',
          )
        : undefined,
  });

  // The tools panel takes precedence over a reply's detail.
  let title: string | null = null;
  let description: string | null = null;
  let body: ReactNode = null;
  if (showTools) {
    title = 'Tools';
    description = 'Tools this agent can call in this conversation.';
    body = <ToolsPanel />;
  } else if (message) {
    const count = message.toolCalls?.length ?? 0;
    title = 'Tool calls';
    description = `${count} ${count === 1 ? 'call' : 'calls'} in this reply.`;
    body = <ToolDetail message={message} />;
  }

  // Closing clears both params, returning to the plain conversation.
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate({
        to: '.',
        search: (prev) => ({
          ...prev,
          detailId: undefined,
          showTools: undefined,
        }),
      });
    }
  };

  return (
    <Drawer open={body !== null} onOpenChange={handleOpenChange} modal={false}>
      <DrawerContent className="data-[swipe-axis=x]:[--drawer-content-width:min(28rem,100vw)]">
        <DrawerHeader className="flex-col gap-0.5">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>
        <DrawerBody>{body}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
