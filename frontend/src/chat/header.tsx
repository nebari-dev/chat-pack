/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { Plus } from 'lucide-react';

import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgents, useChatConfig } from '@/context';

/**
 * A React component that renders the thread header.
 *
 * It names the conversation and its agent. The agent is chosen in the
 * composer, and New chat lives in the sidebar, so a new chat needs no header
 * actions; an open thread offers New chat here as well for convenience.
 */
export function Header(): ReactNode {
  const agents = useAgents();
  const { agentId, thread } = useChatConfig();

  const agent = agents.find((a) => a.id === agentId);
  const agentName = agent?.capabilities.identity?.name || agentId;
  const title = thread ? thread.name || 'Untitled conversation' : 'New chat';

  const newChatLink = <Link to="." search={{ agentId }} />;
  const newChat = thread ? (
    <Button
      render={newChatLink}
      variant="outline"
      size="sm"
      className="hover:no-underline"
    >
      <Plus aria-hidden="true" />
      New chat
    </Button>
  ) : null;

  return (
    <div className="flex h-12 flex-none flex-row items-center gap-2.5 border-border border-b px-4">
      <h1 className="min-w-0 truncate font-medium">{title}</h1>
      <Badge variant="secondary" className="shrink-0">
        {agentName}
      </Badge>
      <span className="grow" />
      {newChat}
    </div>
  );
}
