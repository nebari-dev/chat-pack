/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Files, MessageCircleMore
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useAppStore
} from '@/store';


/**
 * A React component that renders the chat sidebar.
 */
export
function SideBar(): ReactNode {
  // Extract the `sideBarState` from the store.
  const sideBarState = useAppStore(store => store.sideBarState);

  // Extract the `toggleSideBarState` function from the store.
  const toggleSideBarState = useAppStore(store => store.toggleSideBarState);

  // Return the rendered component.
  return (
    <div className={ clsx(
      'flex flex-col flex-none border-r border-bd-neutral-default',
      'w-12 bg-bg-neutral-default text-text-neutral-default select-none'
    ) }>
      <div
        onClick={ () => toggleSideBarState('chats') }
        className={ clsx(
        'py-3 cursor-pointer h-12 border-b',
        sideBarState === 'chats' ?
        'bg-bg-white border-b-bd-neutral-default text-bg-brand-default translate-x-px' :
        'hover:bg-bg-white border-b-transparent'
      ) }>
        <MessageCircleMore className='m-auto'/>
      </div>
      <div
        onClick={ () => toggleSideBarState('files') }
        className={ clsx(
        'py-3 cursor-pointer h-12 border-y',
        sideBarState === 'files' ?
        'bg-bg-white border-y-bd-neutral-default text-bg-brand-default translate-x-px' :
        'hover:bg-bg-white border-y-transparent'
      ) }>
        <Files className='m-auto'/>
      </div>
    </div>
  );
}
