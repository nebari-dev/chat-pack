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
  useSidebar,
} from '@/components/ui/sidebar';

import { threadPageQuery } from '@/queries';

/**
 * A react component that renders the recent threads in the sidebar.
 */
export function Recent(): ReactNode {
  // Fetch the sidebar collapsed state.
  const { collapsed } = useSidebar();

  // Fetch the most recent threads.
  //
  // Note: Sorting is done client-side by computed updatedAt (latest run
  // createdAt), since the server no longer provides updatedAt.
  const page = useQuery(
    threadPageQuery({
      pageSize: 5,
      pageNumber: 1,
      sortBy: 'createdAt',
      sortOrder: 'descending',
    }),
  );

  // Fetch the current thread id, if any, to mark its link active.
  const { threadId } = useSearch({ strict: false });

  // Bail early if the sidebar is collapsed. Thread titles have no icon to
  // fall back to, so the section is hidden rather than squeezed.
  if (collapsed) {
    return null;
  }

  // Sort threads by computed updatedAt (latest run's createdAt) and create links.
  const threads = (page.data?.items || [])
    .slice()
    .sort((a, b) =>
      api.getThreadUpdatedAt(b).localeCompare(api.getThreadUpdatedAt(a)),
    );

  const links = threads.map((thread) => (
    <Private.ThreadLink
      key={thread.id}
      thread={thread}
      active={thread.id === threadId}
    />
  ));

  // Create the content for the section.
  const content =
    links.length > 0 ? (
      <SidebarMenu>{links}</SidebarMenu>
    ) : (
      <p className="px-2 py-1 text-sm text-muted-foreground-strong">
        Recently modified threads will appear here.
      </p>
    );

  // Return the rendered component.
  return (
    <SidebarGroup role="region" aria-labelledby="sidebar-recent-label">
      <SidebarGroupLabel id="sidebar-recent-label">Recent</SidebarGroupLabel>
      {content}
    </SidebarGroup>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders a thread link in the sidebar.
   */
  export function ThreadLink(props: ThreadLink.Props): ReactNode {
    // Extract the props.
    const { thread, active } = props;

    // Return the rendered component.
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          className="px-2"
          active={active}
          render={<Link to="/chat" search={{ threadId: thread.id }} />}
        >
          <SidebarMenuLabel>
            {thread.name || 'Untitled Thread'}
          </SidebarMenuLabel>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  /**
   * The namespace for the `ThreadLink` statics.
   */
  export namespace ThreadLink {
    /**
     * A type alias for the `ThreadLink` props.
     */
    export type Props = {
      /**
       * The thread object for the link.
       */
      readonly thread: api.Thread;

      /**
       * Whether the thread is the one currently open.
       */
      readonly active: boolean;
    };
  }
}
