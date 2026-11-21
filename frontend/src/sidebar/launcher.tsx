/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link, useMatchRoute } from '@tanstack/react-router';

import { History, MessageSquarePlus } from 'lucide-react';

import type { ReactNode } from 'react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuLabel,
} from '@/components/ui/sidebar';

/**
 * A React component that renders the sidebar launcher links.
 */
export function Launcher(): ReactNode {
  return (
    <SidebarMenu>
      <Private.LauncherLink
        to="/chat"
        text="Chat"
        icon={<MessageSquarePlus className="size-5 shrink-0" />}
      />
      <Private.LauncherLink
        to="/history"
        text="History"
        icon={<History className="size-5 shrink-0" />}
      />
    </SidebarMenu>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the `LauncherLink` props.
   */
  export type LauncherLinkProps = {
    /**
     * The route to use for the link.
     */
    readonly to: '/chat' | '/history';

    /**
     * The icon for the button.
     */
    readonly icon: ReactNode;

    /**
     * The text for the button.
     */
    readonly text: string;
  };

  /**
   * A React component that renders a launcher link.
   *
   * The link is active anywhere under its route (e.g. `/chat?threadId=…`),
   * and shows its text as a tooltip while the sidebar is collapsed.
   */
  export function LauncherLink(props: LauncherLinkProps): ReactNode {
    // Extract the props.
    const { to, icon, text } = props;

    // Determine whether the link's route is the current one.
    const matchRoute = useMatchRoute();
    const active = !!matchRoute({ to, fuzzy: true });

    // Return the rendered component.
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="px-2.5"
          active={active}
          tooltip={text}
          render={<Link to={to} />}
        >
          {icon}
          <SidebarMenuLabel>{text}</SidebarMenuLabel>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
}
