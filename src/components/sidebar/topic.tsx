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
  ReactNode
} from 'react';

import {
  DockPanel
} from 'otui/containers';

import {
  useAppStore
} from '@/store';


/**
 * A react component which renders a chat topic in the side bar.
 *
 * #### Notes
 * This component assumes that `chatId` exists in the store.
 */
export
function Topic(props: Topic.Props): ReactNode {
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
  const isOpen = useAppStore(store => {
    // Fetch the dock layout from the store.
    const layout = store.dockLayout;

    // Bail early if the layout is null.
    if (layout === null) {
      return false;
    }

    // Find a tab layout that includes the chat id.
    return DockPanel.findTabLayout(layout, tabLayout =>
      tabLayout.keys.includes(chatId)
    ) !== null;
  });

  // Fetch the `openChat` function from the store.
  const openPanel = useAppStore(store => store.openPanel);

  // Fetch the `deleteChat` functino from the store.
  const deleteChat = useAppStore(store => store.deleteChat);

  // Create the event handler to open an existing chat.
  const handleOpen = () => { openPanel(chatId); };

  // Create the event handler to delete an existing chat.
  const handleDelete = () => { deleteChat(chatId); };

  // Return the rendered component.
  return (
    <li className={ clsx(
      'px-3 h-10 flex items-center justify-between',
      'rounded-sm whitespace-nowrap',
      isOpen ? 'bg-bg-brand-secondary border border-bd-brand-default' : ''
    ) }>
      <span
        onClick={ handleOpen }
        className={ clsx(
          'flex-1 min-w-0 text-text-neutral-default',
          'overflow-hidden text-ellipsis cursor-pointer'
        ) }>
        { name }
      </span>
      <span className='cursor-pointer' onClick={ handleDelete }>
        <EllipsisVertical size={ 16 } />
      </span>
    </li>
  );
}


/**
 * The namespace for the `Topic` component statics.
 */
export
namespace Topic {
  /**
   * A type alias for the `Topic` props.
   */
  export
  type Props = {
    /**
     * The chat id for the topic.
     */
    readonly chatId: string;
  }
}
