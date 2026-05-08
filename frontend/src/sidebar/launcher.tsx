/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import {
  History, MessageSquarePlus
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  cn
} from '@/lib/utils';


/**
 * A React component that renders the sidebar launcher links.
 */
export
function Launcher(props: Launcher.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen } = props;

  // Return the rendered component.
  return (
    <div className='px-2 flex flex-col flex-none gap-px'>
      <Private.LauncherLink
        to='/chat'
        text='Chat'
        collapsed={ !isSidebarOpen }
        icon={ <MessageSquarePlus className='m-auto' size={ 20 } /> } />
      <Private.LauncherLink
        to='/history'
        text='History'
        collapsed={ !isSidebarOpen }
        icon={ <History className='m-auto' size={ 20 } /> } />
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
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the `LauncherLink` props.
   */
  export
  type LauncherLinkProps = {
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
    readonly icon: ReactNode;

    /**
     * The text for the button.
     */
    readonly text: string;
  };

  /**
   * A React component that renders a launcher link.
   */
  export
  function LauncherLink(props: LauncherLinkProps): ReactNode {
    // Extract the props.
    const { to, collapsed, icon, text } = props;

    // Create the active link props.
    const activeProps = {
      className: 'text-bd-brand-default font-semibold'
    };

    // Create the inactive link props.
    const inactiveProps = {
      className: 'hover:bg-bg-neutral-dark'
    };

    // Return the rendered component.
    return (
      <Link
        to={ to }
        activeProps={ activeProps }
        inactiveProps={ inactiveProps }
        className={ cn(
        'h-9 px-1 flex flex-row gap-2 items-center',
        'rounded-sm whitespace-nowrap overflow-hidden') }>
        <span className='flex-none w-6'>{ icon }</span>
        <span className={ collapsed ? 'hidden' : '' }>{ text }</span>
      </Link>
    );
  }
}
