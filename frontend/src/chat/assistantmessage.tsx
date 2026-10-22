/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { ReactNode } from 'react';

import { MarkdownRenderer } from '@/components/markdown/markdownrenderer';

import { ToolSteps } from './toolsteps';

/**
 * A react component that renders an ag-ui assistant message.
 */
export function AssistantMessage(props: AssistantMessage.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-3">
      {message.content ? <MarkdownRenderer content={message.content} /> : null}
      <ToolSteps message={message} />
    </div>
  );
}

/**
 * The namespace for the `AssistantMessage` statics.
 */
export namespace AssistantMessage {
  /**
   * A type alias for the `AssistantMessage` props.
   */
  export type Props = {
    /**
     * The ag-ui assistant message.
     */
    readonly message: agui.AssistantMessage;
  };
}
