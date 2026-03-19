/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import type {
  ReactNode
} from 'react';

import {
  MarkdownRenderer
} from '@/components/markdown/markdownrenderer';


/**
 * A react component that renders an ag-ui assistant message.
 */
export
function AssistantMessage(props: AssistantMessage.Props): ReactNode {
  // Extract the props.
  const { msg } = props;

  // TODO compute tool calls here

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      {/* TODO render tool calls here */}
      <MarkdownRenderer content={ msg.content ?? '' } />
    </div>
  );
}


/**
 * The namespace for the `AssistantMessage` statics.
 */
export
namespace AssistantMessage {
  /**
   * A type alias for the `AssistantMessage` props.
   */
  export
  type Props = {
    /**
     * The ag-ui assistant message.
     */
    readonly msg: agui.AssistantMessage;
  };
}
