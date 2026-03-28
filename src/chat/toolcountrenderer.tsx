/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useQuery
} from '@tanstack/react-query';

import {
  ArrowLeftFromLine, ArrowRightFromLine, Hammer
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  Button
} from '@/components/ui/button';

import {
  useChatConfig, useChatSidebarConfig
} from '@/context';

import {
  cn
} from '@/lib/utils';

import {
  threadMessagesQuery
} from '@/queries';


/**
 * A react component that renders the tool count for an assitant mesage.
 *
 * The count is shown as a button that will open/close the sidebar.
 */
export
function ToolCountRenderer(props: ToolCountRenderer.Props): ReactNode {
  // Extract the props.
  const { messageId } = props;

  // Fetch the thread from the chat config.
  const { thread } = useChatConfig();

  // Fetch the sidebar config for button interaction.
  const { detail, setDetail } = useChatSidebarConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the target thread messages from the chat.
  const { data: message } = useQuery({
    ...query,
    select: msgs => {
      return (msgs ?? []).find(msg => msg.id === messageId);
    }
  });

  // Bail early if the target message is not found.
  if (!message || message.role !== 'assistant') {
    return null;
  }

  // Bail early if the target message doesn't have tool calls.
  if (!message.toolCalls || message.toolCalls.length === 0) {
    return null;
  }

  // Compute the count of tool calls for the message.
  const count = message.toolCalls.length;

  // Determine whether these tools are opened in the chat sidebar.
  const opened = (
    detail &&
    detail.type === 'tool-calls' &&
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
      setDetail({ type: 'tool-calls', messageId });
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
        <Hammer size={ 14 } />
        { `${count} TOOL${count === 1 ? '' : 'S'} CALLED` }
        { openCloseIcon }
      </Button>
    </div>
  );
}


/**
 * The namespace for the `ToolCountRenderer` statics.
 */
export
namespace ToolCountRenderer {
  /**
   * A type alias for the `ToolCountRenderer` props.
   */
  export
  type Props = {
    /**
     * The assistant message id of interest.
     */
    readonly messageId: string;
  };
}
