/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useMatchRoute } from '@tanstack/react-router';

import { History } from 'lucide-react';

import type { ReactNode } from 'react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
} from '@/components/ui/sidebar';

/**
 * A React component that renders the link to the full conversation history,
 * pinned to the bottom of the sidebar's conversation area.
 *
 * It stays visible when the sidebar collapses (as an icon with a tooltip),
 * so History is always one click away.
 */
export function AllConversations(): ReactNode {
  const matchRoute = useMatchRoute();
  const onHistory = !!matchRoute({ to: '/history' });

  const link = <Link to="/history" />;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={link}
          active={onHistory}
          variant="ghost"
          tooltip="All conversations"
          className="px-2 hover:no-underline group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0"
        >
          <History className="size-4 shrink-0" aria-hidden="true" />
          <SidebarMenuLabel className="group-data-[state=collapsed]/sidebar:sr-only">
            All conversations
          </SidebarMenuLabel>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
