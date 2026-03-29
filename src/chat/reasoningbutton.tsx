/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ArrowLeftFromLine, ArrowRightFromLine
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  Button
} from '@/components/ui/button';

import {
  useChatSidebarConfig
} from '@/context';

import {
  cn
} from '@/lib/utils';


/**
 * A react component that renders a "Reasoning" button.
 *
 * The button will open the reasoning results in the chat sidebar.
 */
export
function ReasoningButton(props: ReasoningButton.Props): ReactNode {
  // Extract the props.
  const { messageId } = props;

  // Fetch the sidebar config for button interaction.
  const { detail, setDetail } = useChatSidebarConfig();

  // Determine whether these tools are opened in the chat sidebar.
  const opened = (
    detail &&
    detail.type === 'reasoning' &&
    detail.messageId === messageId
  );

  // Determine the icon to render based on whether the sidebar is open.
  const openCloseIcon = (
    opened ?
    <ArrowLeftFromLine size={ 14 } /> :
    <ArrowRightFromLine size={ 14 } />
  );

  // Create the click handler for the button.
  //
  // If the sidebar is already opened for these tools, it will be
  // closed. Otherwise, the sidebar will be opened/replaced with the
  // content for these tools.
  const onClick = () => {
    if (opened) {
      setDetail(null);
    } else {
      setDetail({ type: 'reasoning', messageId });
    }
  };

  // Return the rendered component.
  return (
    <div>
      <Button
        variant='outline'
        onClick={ onClick }
        className={ cn(
          'h-6 gap-2 items-center flex-0 text-nowrap text-xs',
          'rounded-sm cursor-pointer bg-bg-neutral-dark',
          'hover:no-underline hover:bg-bg-neutral-default' ) }>
        Reasoning
        { openCloseIcon }
      </Button>
    </div>
  );
}


/**
 * The namespace for the `ReasoningButton` statics.
 */
export
namespace ReasoningButton {
  /**
   * A type alias for the `ReasoningButtton` props.
   */
  export
  type Props = {
    /**
     * The message id for the ag-ui `reasoning` message.
     */
    readonly messageId: string;
  };
}
