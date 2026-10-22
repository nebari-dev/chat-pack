/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery } from '@tanstack/react-query';

import { Link, useSearch } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import * as api from '@/api';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
} from '@/components/ui/sidebar';
import { threadPageQuery } from '@/queries';

import { AllConversations } from './allconversations';
import { groupByRecency } from './grouping';

/**
 * The number of recent threads listed in the sidebar. The rest are one click
 * away under "All conversations".
 */
const RECENT_COUNT = 50;

/**
 * The most conversations listed under "Older". Anything past that is in
 * "All conversations", so the sidebar stays short for long-time users.
 */
const OLDER_LIMIT = 10;

/**
 * A React component that renders recent threads grouped by day.
 *
 * The groups hide while the sidebar is collapsed, since a rail of identical
 * icons would not tell conversations apart. The All conversations link at
 * the end of the list stays visible.
 */
export function Recent(): ReactNode {
  const { threadId } = useSearch({ strict: false });

  const page = useQuery(
    threadPageQuery({
      pageSize: RECENT_COUNT,
      pageNumber: 1,
      sortBy: 'createdAt',
      sortOrder: 'descending',
    }),
  );

  // Group by the latest activity (the server has no `updatedAt`) and keep
  // "Older" short.
  const groups = groupByRecency(
    page.data?.items ?? [],
    api.getThreadUpdatedAt,
  ).map((group) =>
    group.label === 'Older'
      ? { ...group, items: group.items.slice(0, OLDER_LIMIT) }
      : group,
  );

  const content =
    groups.length > 0 ? (
      groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((thread) => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                active={thread.id === threadId}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))
    ) : (
      <p className="px-2 text-muted-foreground text-sm">
        Your conversations will appear here.
      </p>
    );

  return (
    <section aria-label="Recent conversations" className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 group-data-[state=collapsed]/sidebar:hidden">
        {content}
      </div>
      <AllConversations />
    </section>
  );
}

/**
 * A React component that renders one thread link in the sidebar.
 */
function ThreadItem(props: {
  readonly thread: api.Thread;
  readonly active: boolean;
}): ReactNode {
  const { thread, active } = props;
  const link = <Link to="/chat" search={{ threadId: thread.id }} />;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={link}
        active={active}
        variant="ghost"
        size="sm"
        className="px-2 font-normal text-muted-foreground-strong hover:no-underline data-[active=true]:font-medium"
      >
        <SidebarMenuLabel>
          {thread.name || 'Untitled conversation'}
        </SidebarMenuLabel>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
