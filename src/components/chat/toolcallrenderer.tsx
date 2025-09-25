/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

// import {
//   useAppStore
// } from '@/store';


/**
 * A React component that renders a tool call response.
 */
export
function ToolCallRenderer(_props: ToolCallRenderer.Props): ReactNode {
  // Extract the props.
  //const { chatId, runId, stepId } = props;

  // // Fetch the response from the store.
  // //
  // // The parent dispatch component has already checked the type of the
  // // response, so this cast is assumed to be safe.
  // const response = useAppStore(
  //   store => store.completionResponses[responseId] as ToolCallResponse
  // );

  // Return the rendered component.
  return (
    <div className='chat-ToolCallRenderer'>
      <div className='chat-ToolCallRenderer-input border'>
        Tool Call Input
      </div>
      <div className='chat-ToolCallRenderer-output border'>
        Tool Call Output
      </div>
    </div>
  );
}


/**
 * A memoized version of `ToolCallRenderer`.
 */
export
const ToolCallRendererMemo = memo(ToolCallRenderer);


/**
 * The namespace for the `ToolCallRenderer` component statics.
 */
export
namespace ToolCallRenderer {
  /**
   * A type alias for the `ToolCallRenderer` props.
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
