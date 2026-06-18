/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { ReactNode } from 'react';

import { MarkdownRenderer } from '@/components/markdown/markdownrenderer';

/**
 * A react component that renders the sidebar reasoning content.
 */
export function SidebarReasoning(props: SidebarReasoning.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Return the rendered component.
  return <MarkdownRenderer content={message.content} />;
}

/**
 * The namespace for the `SidebarReasoning` statics.
 */
export namespace SidebarReasoning {
  /**
   * A type alias for the `SidebarReasoning` props.
   */
  export type Props = {
    /**
     * The reasoning message for the component.
     */
    readonly message: agui.ReasoningMessage;
  };
}
