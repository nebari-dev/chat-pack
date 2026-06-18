/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery } from '@tanstack/react-query';

import type { PropsWithChildren, ReactNode, RefObject } from 'react';

import { useEffect, useRef, useState } from 'react';

import { useChatConfig } from '@/context';

import { threadMessagesQuery } from '@/queries';

/**
 * A react component that renders the scroll viewport for the chat.
 */
export function Viewport(props: PropsWithChildren): ReactNode {
  // Extract the props.
  const { children } = props;

  // Fetch the auto-scroll ref from the hook.
  const ref = Private.useScrollToBottom();

  // Return the rendered component.
  return (
    <div
      ref={ref}
      className="px-4 h-full min-h-0 flex flex-col gap-6 overflow-auto"
    >
      {children}
    </div>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react hook that handles auto-scrolling of the viewport.
   *
   * @returns A ref object that must be added to the viewport.
   */
  export function useScrollToBottom(): RefObject<HTMLDivElement | null> {
    // Define the type for the scroll state.
    type ScrollState = 'auto' | 'user';

    // Fetch the thread from the chat config.
    const { thread } = useChatConfig();

    // Create the query for the thread messages.
    const query = threadMessagesQuery(thread?.id);

    // Fetch the current messages.
    const { data: messages } = useQuery(query);

    // Create the ref object for the tracking div.
    const ref = useRef<HTMLDivElement>(null);

    // Set up the state to track the current scroll state.
    const [scrollState, setScrollState] = useState<ScrollState>('auto');

    // Create an effect that attaches the scroll listener.
    useEffect(() => {
      // Fetch the target div from the ref.
      const div = ref.current;

      // Bail early if the div is not mounted.
      if (!div) {
        return;
      }

      // Create the scroll handler.
      //
      // This handler switches the scroll state based on the current scroll
      // position of the div. If the div is scrolled to bottom, we stick there
      // and continue auto scrolling. If the user scrolls away from the bottom
      // we switch to the user mode which disables the auto scroll on new run
      // input.
      const onScroll = () => {
        if (div.scrollHeight - div.scrollTop - div.clientHeight < 1) {
          setScrollState('auto');
        } else {
          setScrollState('user');
        }
      };

      // Add the scroll event listener to the div.
      div.addEventListener('scroll', onScroll);

      // Return the cleanup function which removes the event listener.
      return () => {
        div.removeEventListener('scroll', onScroll);
      };
    }, []);

    // Create an effect that switches the scroll state to auto on new messages.
    //
    // Whenever a new run is started, this effect will switch the scroll
    // state to `auto` so that the new message is scrolled to the bottom.
    useEffect(() => {
      // Fetch the target div from the ref.
      const div = ref.current;

      // Bail early if the div is not mounted.
      if (!div) {
        return;
      }

      // Set the scroll state to auto.
      setScrollState('auto');
    }, [messages?.length]);

    // Create an effect that scrolls the div on new messages.
    //
    // If the scroll state is set to `auto`, then the div will be scrolled
    // to the bottom on new run input.
    useEffect(() => {
      // Fetch the target div from the ref.
      const div = ref.current;

      // Bail early if the div is not mounted.
      if (!div) {
        return;
      }

      // Bail early if we are not auto-scrolling.
      if (scrollState === 'user') {
        return;
      }

      // Scroll the div to the bottom.
      div.scrollTop = div.scrollHeight;
    }, [scrollState, messages]);

    // Return the ref for tagging onto the chat viewport.
    return ref;
  }
}
