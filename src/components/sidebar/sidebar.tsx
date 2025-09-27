/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import type {
  ReactNode
} from 'react';

import {
  useAppStore
} from '../../store';

import {
  ChatList
} from './chatlist';

import {
  Header
} from './header';

import {
  NewChatButton
} from './newchatbutton';


/**
 * A React component that renders the chat sidebar.
 */
export
function SideBar(): ReactNode {
  // Extract the `sideBarState` from the store.
  const sideBarState = useAppStore(store => store.sideBarState);

  // Return the rendered component.
  return (
    <div className={ clsx(
      'flex flex-col flex-none gap-6 border-r border-bd-neutral-default',
      'transition-[width] duration-150',
      sideBarState === 'open' ? 'p-4 w-70' : 'pt-4 pb-4 pr-3 pl-3 w-16'
    ) }>
      <Header />
      <NewChatButton />
      <ChatList />
    </div>
  );
}
