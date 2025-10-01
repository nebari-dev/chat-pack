/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Plus, Trash2
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
 * A React component that renders the chats panel for the side bar.
 */
export
function ChatsPanel(): ReactNode {
  return (
    <div className='h-full flex flex-col gap-6'>
      <NewChatButton />
      <ChatList />
    </div>
  );
}


/**
 * A React component that renders the "New Chat" button.
 */
function NewChatButton(): ReactNode {
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
      New Chat
    </button>
  );
}


/**
 * A React component that renders the chat list in the chats panel.
 */
function ChatList(): ReactNode {
  // Fetch the chat ids from the store.
  const chatIds = useAppStore(useShallow(store =>
    store.chats.map(chat => chat.id)
  ));

  // Create the chat items for the chat list.
  const items = chatIds.map(chatId =>
    <ChatItem key={ chatId } chatId={ chatId } />
  );

  // Return the rendered component.
  return (
    <div className={ clsx(
      'flex flex-col flex-auto min-h-0 gap-2 select-none'
      ) }>
      <h1 className='flex-none text-lg py-2'>
        Chats
      </h1>
      <div className='flex-auto overflow-y-auto'>
        <ul className='flex flex-col gap-3'>
          { items }
        </ul>
      </div>
    </div>
  );
}


/**
 * A react component that renders an item in the chat list.
 */
function ChatItem(props: ChatItem.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Fetch the chat name from the store.
  const name = useAppStore(store => {
    // Find the chat in the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Return the chat display name.
    return chat.display_name;
  });

  // Determine whether the chat is open in the dock layout.
  const isOpen = useAppStore(store => store.isPanelOpen(chatId));

  // Fetch the `openChat` function from the store.
  const openPanel = useAppStore(store => store.openPanel);

  // Fetch the `deleteChat` functino from the store.
  const deleteChat = useAppStore(store => store.deleteChat);

  // Create the event handler to open an existing chat.
  const handleOpen = (event: MouseEvent) => {
    event.stopPropagation();
    openPanel(chatId);
  };

  // Create the event handler to delete an existing chat.
  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();
    deleteChat(chatId);
  };

  // Return the rendered component.
  return (
    <li
      onClick={ handleOpen }
      className={ clsx(
      'px-3 h-10 flex items-center justify-between',
      'rounded-sm whitespace-nowrap cursor-pointer',
      isOpen ?
      'bg-bg-brand-secondary border border-bd-brand-default' :
      'hover:bg-bg-brand-secondary border border-transparent'
    ) }>
      <span
        className={ clsx(
          'flex-1 min-w-0 text-text-neutral-default',
          'overflow-hidden text-ellipsis'
        ) }>
        { name }
      </span>
      <span onClick={ handleDelete } className='hover:text-bd-brand-default'>
        <Trash2 size={ 16 } />
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
     * The chat id for the item.
     */
    readonly chatId: string;
  }
}
