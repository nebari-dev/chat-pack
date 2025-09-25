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
  useAppStore
} from '@/store';

import {
  MessageRendererMemo
} from './messagerenderer';

import {
  ToolCallRendererMemo
} from './toolcallrenderer';


/**
 * A React component that dispatches a completion response to the appropriate
 * renderer for the `type` of the response.
 *
 * #### Notes
 * This component assumes that `chatId`, `runId`, and `stepId` exist in the
 * store.
 */
export
function ResponseDispatch(props: ResponseDispatch.Props): ReactNode {
  // Extract the props.
  const { chatId, runId, stepId } = props;

  // Fetch the kind of the step from the store.
  const kind = useAppStore(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Get the run for the chat.
    const run = chat.runs.find(run => run.id === runId)!;

    // Get the step for the run.
    const step = run.response.find(step => step.id === stepId)!;

    // Return the step kind.
    return step.kind;
  });

  // Setup the variable to hold the rendered node.
  let node: ReactNode;

  // Dispatch to the appropriate renderer.
  switch (kind) {
  case 'message':
    node = (
      <MessageRendererMemo
        chatId={ chatId }
        runId={ runId }
        stepId={ stepId } />
    );
    break;
  case 'tool-call':
    node = (
      <ToolCallRendererMemo
        chatId={ chatId }
        runId={ runId }
        stepId={ stepId } />
    );
    break;
  default:
    node = <div>Unknown Response Kind: { `${kind}` }</div>;
    break;
  }

  // Return the rendered node.
  return node;
}


/**
 * A memomized version of `ResponseDispatch`
 */
export
const ResponseDispatchMemo = memo(ResponseDispatch);


/**
 * The namespace for the `ResponseDispatch` component statics.
 */
export
namespace ResponseDispatch {
  /**
   * A type alias for the `ResponseDispatch` props.
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

    /**
     * The unique id of the chat run step.
     */
    readonly stepId: string;
  };
}
