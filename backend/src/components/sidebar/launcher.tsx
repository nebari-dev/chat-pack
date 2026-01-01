/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { useMockUser } from '@/components/auth';
import { ROLE_NAV_LINKS, type RoleNavLink } from '@/lib/role-navigation';
import { cn } from '@/lib/utils';


/**
 * A React component that renders the sidebar launcher links.
 */
export
function Launcher(props: Launcher.Props): ReactNode {
  // Extract the props.
  const {isSidebarOpen} = props;
  const { user } = useMockUser();

  const links = user ? ROLE_NAV_LINKS[user.role] ?? [] : [];

  // Return the rendered component.
  return (
    <div className='px-2 flex flex-col flex-none gap-px'>
      {!user || links.length === 0 ? (
        <p className='text-xs text-gray-500 px-2 py-3'>No navigation items</p>
      ) : (
        links.map(link => (
          <LauncherLink
            key={link.to}
            to={link.to}
            text={link.text}
            collapsed={!isSidebarOpen}
            icon={link.icon} />
        ))
      )}
    </div>
  );
}


/**
 * The namespace for the `Launcher` component statics.
 */
export
namespace Launcher {
  /**
   * A type alias for the `Launcher` props.
   */
  export
  type Props = {
    /**
     * Whether sidebar is open.
     */
    readonly isSidebarOpen: boolean;
  };
}


/**
 * A React component that renders a launcher link.
 */
function LauncherLink(props: LauncherLink.Props): ReactNode {
  // Extract the props.
  const {to, collapsed, icon: Icon, text} = props;

  // Create the active link props.
  const activeProps = {
    className: cn(
      'text-bd-brand-default hover:bg-bg-brand-secondary font-semibold'
    )
  };

  // Create the inactive link props.
  const inactiveProps = {
    className: 'hover:bg-bg-neutral-dark'
  };

  // Return the rendered component.
  return (
    <Link
      to={to}
      activeProps={activeProps}
      inactiveProps={inactiveProps}
      className={cn(
      'h-9 px-1 flex flex-row gap-2 items-center cursor-pointer',
      'rounded-xs whitespace-nowrap overflow-hidden')}>
      <span className='flex-none w-6'>
        <Icon className='m-auto' size={20} />
      </span>
      <span className={ collapsed ? 'hidden' : '' }>{text}</span>
    </Link>
  );
}


/**
 * The namespace for the `LauncherLink` component statics.
 */
namespace LauncherLink {
  /**
   * A type alias for the `LauncherLink` props.
   */
  export
  type Props = {
    /**
     * The route to use for the link.
     */
    readonly to: string;

    /**
     * Whether the button is collapsed.
     */
    readonly collapsed: boolean;

    /**
     * The icon for the button.
     */
    readonly icon: LucideIcon;

    /**
     * The text for the button.
     */
    readonly text: string;
  };
}


type NavLink = RoleNavLink;
