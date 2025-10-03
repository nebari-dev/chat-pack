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
  memo
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow';

import {
  useAppStore
} from '@/store';

import {
  ResponseDispatchMemo
} from './responsedispatch';


/**
 * A React component that renders a response in a chat.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function ResponseRenderer(props: ResponseRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId } = props;

  // Fetch the response ids from the store.
  const stepIds = useAppStore(useShallow(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Get the run from the chat.
    const run = chat.runs.find(run => run.id === runId)!;

    // Create the step ids for the run.
    return run.response.map(step => step.id);
  }));

  // Create the children for the response.
  const children = stepIds.map(stepId =>
    <ResponseDispatchMemo
      key={ stepId }
      chatId={ chatId }
      runId={ runId }
      stepId={ stepId } />
  );

  // Return the rendered component.
  return (
    <div className={ clsx(
      'p-3 select-text rounded-xs bg-bg-neutral-white',
      'border border-bd-neutral-default overflow-x-auto'
    ) }>
      { children }
    </div>
  );
}


/**
 * A memoized version of the `ResponseRenderer`.
 */
export
const ResponseRendererMemo = memo(ResponseRenderer);


/**
 * The namespace for the `ResponseRenderer` component statics.
 */
export
namespace ResponseRenderer {
  /**
   * A type alias for the `ResponseRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id of the chat.
     */
    readonly chatId: string;

    /**
     * The unique id of the chat run.
     */
    readonly runId: string;
  };
}
