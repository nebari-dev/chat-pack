/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useSearch } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, getAgentInitials } from '@/components/avatar';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
} from '@/components/ui/sidebar';
import { useAgents } from '@/context';

/**
 * A React component that renders the agent list in the sidebar.
 *
 * Clicking an agent starts a new chat with it. The agent is marked active
 * while its new, not-yet-sent chat is open.
 */
export function Agents(): ReactNode {
  const agents = useAgents();
  const { agentId, threadId } = useSearch({ strict: false });

  if (agents.length === 0) {
    return null;
  }

  const items = agents.map((agent) => {
    const name = agent.capabilities.identity?.name || agent.id;
    const active = agent.id === agentId && !threadId;
    const link = <Link to="/chat" search={{ agentId: agent.id }} />;
    return (
      <SidebarMenuItem key={agent.id}>
        <SidebarMenuButton
          render={link}
          active={active}
          variant="ghost"
          tooltip={name}
          className="px-2 hover:no-underline group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
        >
          <Avatar className="size-5">
            <AvatarFallback className="bg-primary font-semibold text-[10px] text-primary-foreground">
              {getAgentInitials(name)}
            </AvatarFallback>
          </Avatar>
          <SidebarMenuLabel className="group-data-[state=collapsed]/sidebar:sr-only">
            {name}
          </SidebarMenuLabel>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Agents</SidebarGroupLabel>
      <SidebarMenu>{items}</SidebarMenu>
    </SidebarGroup>
  );
}
