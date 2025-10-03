/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  PanelLeft
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useAppStore
} from '@/store';


/**
 * A React component that renders the sidebar header.
 */
export
function Header(): ReactNode {
  // Fetch the `sidebarState` from the store.
  const sidebarState = useAppStore(store => store.sidebarState);

  // Fetch the `toggleSidebarState` update function from the store..
  const toggleSidebarState = useAppStore(store => store.toggleSidebarState);

  // Determine whether the sidebar is collapsed.
  const collapsed = sidebarState === 'collapsed';

  // Create the click handler for the toggle button.
  const handleClick = () => { toggleSidebarState() };

  // Return the rendered component with the sidebar state.
  return (
    <div className={ clsx(
      'flex flex-row flex-none h-12 p-2',
        collapsed ? 'justify-center' : 'justify-between'
      ) }>
      <div className={ clsx(
        'bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)] bg-[auto_100px]',
        'bg-center bg-no-repeat w-[100px] cursor-pointer ml-2',
        collapsed ? 'hidden' : ''
        ) }>
        <a className='block w-full h-full' href='/' />
      </div>
      <button
        onClick={ handleClick }
        className='cursor-pointer w-8 rounded-xs hover:bg-bg-neutral-dark'>
        <PanelLeft size={ 20 } className='m-auto'/>
      </button>
    </div>
  );
}
