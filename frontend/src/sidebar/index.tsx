/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import {
  Sidebar as NebariSidebar,
  SidebarContent,
  SidebarProvider,
} from '@/components/ui/sidebar';

import { Agents } from './agents';

import { AllConversations } from './allconversations';

import { Footer } from './footer';

import { NewChat } from './newchat';

import { Recent } from './recent';

/**
 * The viewport width below which the sidebar auto-collapses.
 *
 * This gives the chat content room on narrow screens. It matches Tailwind's
 * `lg` breakpoint.
 */
const COLLAPSE_QUERY = '(max-width: 1024px)';

/**
 * A React component that renders the application sidebar.
 *
 * The sidebar is the app's only navigation: start a new chat, pick an agent,
 * reopen a recent conversation, or browse all of them.
 */
export function Sidebar(): ReactNode {
  // Seed the collapsed state from the viewport so a narrow first paint
  // starts collapsed.
  const [collapsed, setCollapsed] = useState<boolean>(
    () => window.matchMedia(COLLAPSE_QUERY).matches,
  );

  // Follow the breakpoint when the viewport crosses it. Reacting to the
  // media query's `change` event (rather than forcing the state on every
  // render) leaves the user free to toggle manually on either side of it.
  useEffect(() => {
    const media = window.matchMedia(COLLAPSE_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setCollapsed(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <NebariSidebar
        aria-label="Conversations"
        className="rounded-none border-sidebar-border border-r"
      >
        <NewChat />
        <SidebarContent className="gap-4 pt-1">
          <Agents />
          <Recent />
        </SidebarContent>
        {/* Pinned below the scrolling list so History is always in reach. */}
        <div className="px-2 pt-1 pb-2">
          <AllConversations />
        </div>
        <Footer />
      </NebariSidebar>
    </SidebarProvider>
  );
}
