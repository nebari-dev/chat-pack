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

import {
  ToolCountRenderer
} from './toolcountrenderer';


/**
 * A react component that renders an ag-ui assistant message.
 */
export
function AssistantMessage(props: AssistantMessage.Props): ReactNode {
  // Extract the props.
  const { msg } = props;

  // Return the rendered component.
  return (
    <div className='flex flex-col'>
      <MarkdownRenderer content={ msg.content ?? '' } />
      <ToolCountRenderer messageId={ msg.id } />
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
