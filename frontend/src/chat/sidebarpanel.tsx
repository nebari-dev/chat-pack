/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';

import { SidebarReasoning } from './sidebarreasoning';

import { SidebarTools } from './sidebartools';

/**
 * A react component that renders the sidebar panel for a detail message.
 */
export function SidebarPanel(props: SidebarPanel.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Create the variables to the hold the title and content.
  let title: string;
  let content: ReactNode;

  // Dispatch on the role.
  switch (message.role) {
    case 'reasoning':
      title = 'Reasoning';
      content = <SidebarReasoning message={message} />;
      break;
    case 'assistant':
      title = 'Tool Calls';
      content = <SidebarTools message={message} />;
      break;
    default:
      throw 'unreachable';
  }

  // Return the rendered component.
  return (
    <section className="h-full flex flex-col">
      <h1 className="p-2 flex flex-row justify-between items-center">
        <span className="text-xl font-bold">{title}</span>
        <Link to="." search={(prev) => ({ ...prev, detailId: undefined })}>
          <X />
        </Link>
      </h1>
      <Separator />
      <div className="p-2 grow overflow-auto">{content}</div>
    </section>
  );
}

/**
 * The namespace for the `SidebarPanel` statics.
 */
export namespace SidebarPanel {
  /**
   * A type alias for the `SidebarPanel` props.
   */
  export type Props = {
    /**
     * The ag-ui message to render as the detail in the sidebar.
     */
    readonly message: agui.ReasoningMessage | agui.AssistantMessage;
  };
}
