/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import {
  SidebarContent,
  SidebarHeader,
  Sidebar as SidebarPrimitive,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { Launcher } from './launcher';

import { Recent } from './recent';

/**
 * The viewport width below which the sidebar auto-collapses.
 *
 * This gives the chat content room on narrow screens. It matches Tailwind's
 * `lg` breakpoint.
 */
const COLLAPSE_QUERY = '(max-width: 1024px)';

/**
 * A React component that renders the collapsible application sidebar.
 */
export function Sidebar(): ReactNode {
  // Setup the state to track the collapsed state, seeded from the current
  // viewport so a narrow first paint starts collapsed. The registry provider
  // is controlled so the viewport listener below can drive it too.
  const [collapsed, setCollapsed] = useState<boolean>(
    () => window.matchMedia(COLLAPSE_QUERY).matches,
  );

  // Auto-collapse the sidebar when the viewport narrows past the breakpoint,
  // and re-open it when the viewport widens again. Reacting to the media
  // query's `change` event (rather than forcing the state on every render)
  // leaves the user free to toggle the sidebar manually while staying on one
  // side of the breakpoint.
  useEffect(() => {
    const media = window.matchMedia(COLLAPSE_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setCollapsed(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Return the rendered component.
  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <SidebarPrimitive
        aria-label="Main"
        className="rounded-none border-r border-border bg-sidebar"
      >
        <SidebarHeader className="justify-end group-data-[state=collapsed]/sidebar:justify-center">
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent className="gap-4">
          <Launcher />
          <Recent />
        </SidebarContent>
      </SidebarPrimitive>
    </SidebarProvider>
  );
}
