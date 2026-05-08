/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import {
  PanelLeft
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  cn
} from '@/lib/utils';


/**
 * A React component that renders the sidebar header.
 */
export
function Header(props: Header.Props): ReactNode {
  // Extract the props.
  const {isSidebarOpen, toggleSidebar} = props;

  // Return the rendered component with the sidebar state.
  return (
    <div className={cn(
      'flex flex-row flex-none h-12 p-2',
      isSidebarOpen ? 'justify-between' : 'justify-center')}>
      <Link to='/' className={cn(
        'bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)] bg-[auto_100px]',
        'bg-center bg-no-repeat w-[100px] cursor-pointer ml-2',
        isSidebarOpen ? '' : 'hidden')} />
      <button
        onClick={toggleSidebar}
        className='cursor-pointer w-8 rounded-sm hover:bg-bg-neutral-dark'>
        <PanelLeft size={20} className='m-auto' />
      </button>
    </div>
  );
}


/**
 * The namespace for the `Header` component statics.
 */
export
namespace Header {
  /**
   * A type alias for the `Header` props.
   */
  export
  type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;

    /**
     * A callback to toggle the open state of the sidebar.
     */
    readonly toggleSidebar: () => void;
  };
}
