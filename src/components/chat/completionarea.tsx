/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow';

import {
  useAppStore
} from '@/store';

import {
  CompletionRendererMemo
} from './completionrenderer';

import './completionarea.css';


/**
 * A React component that renders the chat completion area.
 *
 * #### Notes
 * This component assumes that `chatId` exists in the store.
 */
export
function CompletionArea(props: CompletionArea.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Fetch the run ids for the chat.
  const runIds = useAppStore(useShallow(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Return the run ids for the chat.
    return chat.runs.map(run => run.id);
  }));

  // Create the renderers for the chat completions.
  const children = runIds.map(runId =>
    <CompletionRendererMemo key={ runId } chatId={ chatId } runId={ runId } />
  );

  // Return the rendered component.
  return (
    <div className='chat-CompletionArea'>
      { children }
    </div>
  );
}


/**
 * A memoized version of `CompletionArea`.
 */
export
const CompletionAreaMemo = memo(CompletionArea);


/**
 * The namespace for the `CompletionArea` component statics.
 */
export
namespace CompletionArea {
  /**
   * A type alias for the `CompletionArea` props.
   */
  export
  type Props = {
    /**
     * The chat id for the completion area.
     */
    chatId: string;
  };
}
