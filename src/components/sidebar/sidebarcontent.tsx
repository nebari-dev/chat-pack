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
} from '@/store';

import {
  ChatsPanel
} from './chatspanel';

import {
  FilesPanel
} from './filespanel';


/**
 * A React component that renders the SideBar content.
 */
export
function SideBarContent(): ReactNode {
  // Fetch the side bar state from the store.
  const sideBarState = useAppStore(store => store.sideBarState);

  // Set up the variable for the side bar content.
  let content: ReactNode = null;

  // Render the content based on the side bar state.
  switch (sideBarState) {
  case 'chats':
    content = <ChatsPanel />;
    break;
  case 'files':
    content = <FilesPanel />;
    break;
  default:
    break;
  }

  // Return the rendered component.
  return (
    <div className={ clsx(
      'p-3 w-68 bg-bg-neutral-white border-r border-r-bd-neutral-default',
      sideBarState === 'none' ? 'hidden' : ''
    ) }>
      {content}
    </div>
  );
}
