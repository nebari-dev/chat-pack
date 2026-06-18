/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';

import type { ReactNode } from 'react';

import { useChatConfig } from '@/context';

import { cn } from '@/lib/utils';

/**
 * A react component that renders a "Reasoning" link.
 *
 * The link will open the reasoning content in the chat sidebar.
 */
export function ReasoningLink(props: ReasoningLink.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Fetch the sidebar config for button interaction.
  const { detailId } = useChatConfig();

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
          detailId: opened ? undefined : message.id,
        })}
        className={cn(
          'px-2 h-6 inline-flex gap-2 items-center text-nowrap text-xs',
          'rounded-sm cursor-pointer bg-bg-neutral-dark border',
          'hover:no-underline hover:bg-bg-neutral-default',
        )}
      >
        Reasoning
        {openCloseIcon}
      </Link>
    </div>
  );
}

/**
 * The namespace for the `ReasoningLink` statics.
 */
export namespace ReasoningLink {
  /**
   * A type alias for the `ReasoningLink` props.
   */
  export type Props = {
    /**
     * The ag-ui reasoning message of interest.
     */
    readonly message: agui.ReasoningMessage;
  };
}
