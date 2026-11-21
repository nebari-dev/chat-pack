/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { Link } from '@tanstack/react-router';

import { ArrowLeftFromLine, ArrowRightFromLine } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { useChatConfig } from '@/context';

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

  // Create the link the button renders as.
  const link = (
    <Link
      to="."
      search={(prev) => ({
        ...prev,
        detailId: opened ? undefined : message.id,
      })}
    />
  );

  // Return the rendered component.
  return (
    <div>
      <Button
        variant="outline"
        size="xs"
        className="hover:no-underline"
        render={link}
      >
        Reasoning
        {openCloseIcon}
      </Button>
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
