/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo, useEffect
} from 'react';

import {
  useAppStore
} from '@/store';

import {
  AttachmentsRendererMemo
} from './attachmentsrenderer';

import {
  ChatScroller
} from './chatscroller';


/**
 * A React component that renders a request in a chat.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function RequestRenderer(props: RequestRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId } = props;

  // Fetch the request text from the store.
  const requestText = useAppStore(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Get the run for the chat.
    const run = chat.runs.find(run => run.id === runId)!;

    // Create the request text for the run.
    return run.request.parts.filter(part =>
      part.kind === 'text'
    ).flatMap(part =>
      part.data.content_parts
    ).join('');
  });

  // Scroll the chat to the bottom after rendering.
  useEffect(() => {
    ChatScroller.scrollToBottom(chatId);
  }, [chatId, requestText]);

  // Return the rendered component.
  return (
    <div className='flex flex-col items-end gap-2 overflow-hidden'>
      <div className=
        'p-3 bg-bg-neutral-default rounded-xs select-text max-w-2xl'>
        <p>{ requestText }</p>
      </div>
      <AttachmentsRendererMemo chatId={ chatId } runId={ runId }/>
    </div>
  );
}


/**
 * A memoized version of `RequestRenderer`.
 */
export
const RequestRendererMemo = memo(RequestRenderer);


/**
 * The namespace for the `RequestRenderer` component statics.
 */
export
namespace RequestRenderer {
  /**
   * A type alias for the `RequestRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id for the chat.
     */
    readonly chatId: string;

    /**
     * The unique id of the chat run.
     */
    readonly runId: string;
  };
}
