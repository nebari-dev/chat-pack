/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  EllipsisVertical
} from 'lucide-react';

import type {
  MouseEvent, ReactNode
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow';

import {
  useAppStore
} from '@/store';


/**
 * A React component that renders the recent chats in the sidebar.
 */
export
function RecentChats(): ReactNode {
  // Fetch the chat ids from the store.
  const chatIds = useAppStore(useShallow(store =>
    store.chats.map(chat => chat.id)
  ));

  // Extract the `sideBarState` from the store.
  const sidebarState = useAppStore(store => store.sidebarState);

  // Determine whether the sidebar is collaposed.
  const collapsed = sidebarState === 'collapsed';

  // Create the chat items.
  const items = chatIds.map(chatId =>
    <ChatItem key={ chatId } chatId={ chatId } />
  );

  // Return the rendered component
  return (
    <div className={ clsx(
      'px-2 flex-auto flex flex-col min-h-0 select-none',
      collapsed ? 'hidden' : ''
    ) }>
      <h3 className={ clsx(
        'px-2 h-9 flex-none flex flex-row items-center whitespace-nowrap',
        'text-text-neutral-secondary'
      ) }>
        Recent Chats
      </h3>
      <ul className='flex-auto flex flex-col gap-1 overflow-y-auto'>
        { items }
      </ul>
    </div>
  );
}


/**
 * A React component that renders a recent chat item.
 */
function ChatItem(props: ChatItem.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Fetch the chat name from the store.
  const name = useAppStore(store =>
    store.chats.find(chat => chat.id === chatId)!.display_name
  );

  // Fetch whether the panel is open.
  const isOpen = useAppStore(store => store.isPanelOpen(chatId));

  // Fetch the `openPanel` function from the store.
  const openPanel = useAppStore(store => store.openPanel);

  // Fetch the `deleteChat` function from the store.
  const deleteChat = useAppStore(store => store.deleteChat);

  // Set up the click handler to show the chat.
  const handleClick = (event: MouseEvent) => {
    // Stop propagation of the event.
    event.stopPropagation();

    // Open the chat panel.
    openPanel(chatId);
  };

  // Set up the click handler to delete the chat.
  const handleDelete = (event: MouseEvent) => {
    // Stop propagation so that it doesn't select the chat.
    event.stopPropagation();

    // Delete the chat.
    deleteChat(chatId);
  };

  // Return the rendered component.
  return (
    <li
      onClick={ handleClick }
      className={ clsx(
      'px-2 h-8 flex-none flex flex-row items-center justify-between',
      'rounded-xs cursor-pointer',
      isOpen ? 'bg-bg-brand-secondary' : 'hover:bg-bg-neutral-dark'
    ) }>
      <span className=
        'flex-auto whitespace-nowrap text-ellipsis overflow-hidden'>
        { name || 'Untitled' }
      </span>
      <span onClick={ handleDelete } className='flex-none'>
        <EllipsisVertical className='m-auto' size={ 16 } />
      </span>
    </li>
  );
}


/**
 * The namespace for the `ChatItem` component statics.
 */
namespace ChatItem {
  /**
   * A type alias for the `ChatItem` props.
   */
  export
  type Props = {
    /**
     * The unique id of the chat.
     */
    readonly chatId: string;
  };
}
