/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Plus
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useAppStore
} from '../../store';


/**
 * A React component that renders a "New Chat" button.
 *
 * The button delegates to the app store for creating new chats.
 */
export
function NewChatButton(): ReactNode {
  // Fetch the `sideBarState` from the store.
  const sideBarState = useAppStore(store => store.sideBarState);

  // Fetch the `createChat` function from the store.
  const createChat = useAppStore(store => store.createChat);

  // Create the click handler for the button.
  const onClick = () => { createChat() };

  // Return the rendered button.
  return (
    <button
      onClick={ onClick }
      className={ clsx(
        'flex flex-row flex-none items-center justify-center gap-2',
        'whitespace-nowrap rounded-sm border border-bd-brand-default',
        'text-text-brand-on-brand bg-bg-brand-default h-9 cursor-pointer',
      ) }>
      <Plus size={ 16 } />
      <span className={ sideBarState === 'collapsed' ? 'hidden' : '' }>
        New Chat
      </span>
    </button>
  );
}
