/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useSearch } from '@tanstack/react-router';

import { Plus } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

/**
 * A React component that renders the sidebar's primary New chat action.
 *
 * It starts a new chat with the agent currently in view, so "new chat" from a
 * conversation stays with that conversation's agent.
 */
export function NewChat(): ReactNode {
  const { collapsed } = useSidebar();

  // Read the current agent loosely; the sidebar renders on every route.
  const { agentId } = useSearch({ strict: false });

  const link = <Link to="/chat" search={{ agentId }} />;

  return (
    <SidebarHeader className="px-2 pt-3 pb-2">
      <Button
        render={link}
        size={collapsed ? 'icon' : 'default'}
        aria-label={collapsed ? 'New chat' : undefined}
        className={cn(
          'hover:no-underline',
          collapsed ? 'mx-auto' : 'w-full justify-start',
        )}
      >
        <Plus aria-hidden="true" />
        {collapsed ? null : <span>New chat</span>}
      </Button>
    </SidebarHeader>
  );
}
