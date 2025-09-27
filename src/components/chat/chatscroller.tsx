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
  useCallback, useEffect, useRef
} from 'react';


/**
 * A React component which enables easy "scroll-to-bottom" for a chat.
 */
export
function ChatScroller(props: ChatScroller.Props): ReactNode {
  // Extract the props.
  const { chatId, children } = props;

  // Set up a ref for the scroller node.
  const ref = useRef<HTMLDivElement>(null);

  // Handle the scroll-to-bottom event.
  const onScrollToBottom = useCallback(() => {
    const node = ref.current!;
    node.scrollTop = node.scrollHeight;
  }, []);

  // Use an effect to subscribe to the scroll to bottom event.
  useEffect(() => {
    return Private.subscribe('scroll-to-bottom', chatId, onScrollToBottom);
  }, []);

  // Return the rendered component.
  return (
    <div
      ref={ ref }
      className={ clsx(
        'flex flex-col flex-1 gap-6 pt-6 pr-6 pl-6',
        'overflow-x-hidden overflow-y-auto scroll-smooth'
      ) }>
      { children }
    </div>
  );
}


/**
 * The namespace for the `ChatScroller` component statics.
 */
export
namespace ChatScroller {
  /**
   * A type alias for the `ChatScroller` props.
   */
  export
  type Props = {
    /**
     * The unique id of the chat.
     */
    readonly chatId: string;

    /**
     * The children to render in the scroller.
     */
    readonly children: ReactNode;
  };

  /**
   * Dispatch an event to scroll the chat to the bottom.
   *
   * @param chatId - The id of the chat that should scroll to bottom.
   */
  export
  function scrollToBottom(chatId: string): void {
    Private.dispatch('scroll-to-bottom', chatId);
  }
}


/**
 * The namepsace for the module implemention details.
 */
namespace Private {
  /**
   * Dispatch a custom event for the given chat id.
   */
  export
  function dispatch(name: string, chatId: string): void {
    const type = createEventType(name, chatId);
    eventTarget.dispatchEvent(new Event(type));
  }

  /**
   * Subscribe to a custom event for the given chat id.
   *
   * Returns the unsubscribe callback.
   */
  export
  function subscribe(
    name: string, chatId: string, callback: () => void
  ): () => void {
    const type = createEventType(name, chatId);
    eventTarget.addEventListener(type, callback);
    return () => { eventTarget.removeEventListener(type, callback); };
  }

  /**
   * The internal event target for dispatching events.
   */
  const eventTarget = new EventTarget();

  /**
   * Create a custom event name unique to the given chat id.
   */
  function createEventType(name: string, chatId: string): string {
    return `${name}-${chatId}`;
  }
}
