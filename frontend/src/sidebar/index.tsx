/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Header } from './header';

import { Launcher } from './launcher';

import { Recent } from './recent';

import { UserProfile } from './userprofile';

/**
 * The viewport width below which the sidebar auto-collapses.
 *
 * This gives the chat content room on narrow screens. It matches Tailwind's
 * `lg` breakpoint.
 */
const COLLAPSE_QUERY = '(max-width: 1024px)';

/**
 * A React component that renders the application sidebar.
 */
export function Sidebar(): ReactNode {
  // Setup the state to track the sidebar open state, seeded from the current
  // viewport so a narrow first paint starts collapsed.
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(
    () => !window.matchMedia(COLLAPSE_QUERY).matches,
  );

  // Create the toggle handler for the sidebar state.
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Auto-collapse the sidebar when the viewport narrows past the breakpoint,
  // and re-open it when the viewport widens again. Reacting to the media
  // query's `change` event (rather than forcing the state on every render)
  // leaves the user free to toggle the sidebar manually while staying on one
  // side of the breakpoint.
  useEffect(() => {
    const media = window.matchMedia(COLLAPSE_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSidebarOpen(!event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Return the rendered component.
  return (
    <div
      className={cn(
        'flex flex-col flex-none gap-3 border-r border-bd-neutral-default',
        'bg-bg-white transition-[width] duration-150',
        isSidebarOpen ? 'w-60' : 'w-12.25',
      )}
    >
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Launcher isSidebarOpen={isSidebarOpen} />
      <Recent isSidebarOpen={isSidebarOpen} />
      <div className="grow" />
      <UserProfile isSidebarOpen={isSidebarOpen} />
    </div>
  );
}
