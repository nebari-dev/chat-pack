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
} from '../../store';


/**
 * A React component that renders the sidebar header.
 */
export
function Header(): ReactNode {
  // Fetch the `sideBarState` from the store.
  const sideBarState = useAppStore(store => store.sideBarState);

  // Fetch the `sideBarState` update function.
  const toggleSideBarState = useAppStore(store => store.toggleSideBarState);

  // Create the click handler for the toggle button.
  const handleClick = () => { toggleSideBarState() };

  // Return the rendered component with the sidebar state.
  return (
    <div className={ clsx(
      'flex flex-row flex-none h-9',
      sideBarState === 'open' ? 'justify-between' : 'justify-center'
      ) }>
      <div className={ clsx(
        'bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)] bg-[auto_100px]',
        'bg-center bg-no-repeat w-[100px] cursor-pointer',
        sideBarState === 'collapsed' ? 'hidden' : ''
        ) }>
        <a className='block w-full h-full' href='/' />
      </div>
      <button className='cursor-pointer' onClick={ handleClick }>
        <PanelLeft size={ 16 }/>
      </button>
    </div>
  );
}
