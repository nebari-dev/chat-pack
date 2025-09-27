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
  RequestRendererMemo
} from './requestrenderer';

import {
  ResponseRendererMemo
} from './responserenderer';


/**
 * A React component which renders a chat completion.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function CompletionRenderer(props: CompletionRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId } = props;

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-6'>
      <RequestRendererMemo chatId={ chatId } runId={ runId } />
      <ResponseRendererMemo chatId={ chatId } runId={ runId } />
    </div>
  );
}


/**
 * A memoized version of `CompletionRenderer`.
 */
export
const CompletionRendererMemo = memo(CompletionRenderer);


/**
 * The namespace for the `CompletionRenderer` component statics.
 */
export
namespace CompletionRenderer {
  /**
   * A type alias for the `CompletionRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id for the chat.
     */
    readonly chatId: string;

    /**
     * The unique id for the completion run.
     */
    readonly runId: string;
  };
}
