/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  X
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  memo, useEffect, useRef
} from 'react';

import {
  useAppStore
} from '@/store';


/**
 * A React component which renders the tab content for a chat.
 *
 * #### Notes
 * This component assumes that `chatId` exists in the store.
 */
export
function ChatTab(props: ChatTab.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Get the chat name from the store.
  const chatName = useAppStore(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Return the display name for the chat.
    return chat.display_name;
  });

  // Get the `closePanel` function from the store.
  const closePanel = useAppStore(store => store.closePanel);

  // Set up the ref to handle the close icon span.
  const closeRef = useRef<HTMLSpanElement>(null);

  // Set up the event handler to handle the close.
  const handleClose = () => { closePanel(chatId); };

  // Use an effect to attach a native event listener to the span. A native
  // listener is needed here, because the `DockPanel` uses native listeners
  // to implement its behavior. Since we need to stop propagation *before*
  // the event reaches the `DockPanel`, we can't use a React event listener.
  useEffect(() => {
    // Fetch the target element.
    const elem = closeRef.current!;

    // Create the listener.
    const listener = (event: PointerEvent) => {
      // Stop propagation to prevent the `DockPanel` from selecting the
      // tab when the user is clicking on the close icon.
      event.stopPropagation();

      // Prevent the default to prevent the browser from starting a drag
      // action when the user is clicking on the close icon.
      event.preventDefault();
    };

    // Add the listener to the element.
    elem.addEventListener('pointerdown', listener);

    // Return the cleanup function.
    return () => { elem.removeEventListener('pointerdown', listener); };
  });

  // Return the rendered component.
  return (
    <div className='flex flex-row w-full h-full items-center'>
      <span className='flex-1 min-w-0 overflow-hidden text-ellipsis'>
        { chatName || 'Untitled' }
      </span>
      <span
        ref={ closeRef }
        onClick={ handleClose }
        className='flex-none cursor-pointer'>
        <X size={ 16 } />
      </span>
    </div>
  );
}


/**
 * A memoized version of `ChatTab`.
 */
export
const ChatTabMemo = memo(ChatTab);


/**
 * The namespace for the `ChatTab` component statics.
 */
export
namespace ChatTab {
  /**
   * A type alias for the `ChatTab` props.
   */
  export
  type Props = {
    /**
     * The unique id for the chat.
     */
    readonly chatId: string;
  };
}
