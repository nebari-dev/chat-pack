/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { ArrowLeftFromLine, ArrowRightFromLine, Hammer } from 'lucide-react';

import type { ReactNode } from 'react';

import { useChatConfig } from '@/context';

import { cn } from '@/lib/utils';

/**
 * A react component that renders the tool count for an assitant mesage.
 *
 * The link will open the tool content in the chat sidebar.
 */
export function ToolCountLink(props: ToolCountLink.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Fetch the detail id from the chat config.
  const { detailId } = useChatConfig();

  // Compute the count of tool calls for the message.
  const count = message.toolCalls?.length ?? 0;

  // Bail early if there is nothing to render.
  if (count === 0) {
    return null;
  }

  // Determine whether this message is opened in the chat sidebar.
  const opened = message.id === detailId;

  // Determine the icon to render based on whether the sidebar is open.
  const openCloseIcon = opened ? (
    <ArrowLeftFromLine size={14} />
  ) : (
    <ArrowRightFromLine size={14} />
  );

  // Return the rendered component.
  return (
    <div>
      <Link
        to="."
        search={(prev) => ({
          ...prev,
          // Opening a message detail closes the tools panel so the
          // two never compete for the right sidebar slot.
          showTools: undefined,
          detailId: opened ? undefined : message.id,
        })}
        className={cn(
          'px-2 h-6 inline-flex gap-2 items-center text-nowrap text-xs',
          'rounded-sm cursor-pointer bg-bg-neutral-dark border',
          'hover:no-underline hover:bg-bg-neutral-default',
        )}
      >
        <Hammer size={14} />
        {`${count} TOOL${count === 1 ? '' : 'S'} CALLED`}
        {openCloseIcon}
      </Link>
    </div>
  );
}

/**
 * The namespace for the `ToolCountLink` statics.
 */
export namespace ToolCountLink {
  /**
   * A type alias for the `ToolCountLink` props.
   */
  export type Props = {
    /**
     * The agui assistant message of interest.
     */
    readonly message: agui.AssistantMessage;
  };
}
