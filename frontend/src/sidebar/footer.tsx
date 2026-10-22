/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useMatchRoute } from '@tanstack/react-router';

import { History } from 'lucide-react';

import type { ReactNode } from 'react';

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
  SidebarTrigger,
} from '@/components/ui/sidebar';

/**
 * A React component that renders the sidebar footer: the link to the full
 * conversation history and the collapse toggle.
 */
export function Footer(): ReactNode {
  const matchRoute = useMatchRoute();
  const onHistory = !!matchRoute({ to: '/history' });

  const link = <Link to="/history" />;

  return (
    <SidebarFooter className="flex flex-col gap-1 border-sidebar-border border-t bg-sidebar">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={link}
            active={onHistory}
            variant="ghost"
            tooltip="All conversations"
            className="px-2 hover:no-underline"
          >
            <History className="size-4 shrink-0" aria-hidden="true" />
            <SidebarMenuLabel>All conversations</SidebarMenuLabel>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarTrigger className="ml-1" />
    </SidebarFooter>
  );
}
