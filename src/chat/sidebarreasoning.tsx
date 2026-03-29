/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import {
  useQuery
} from '@tanstack/react-query';

import {
  X
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  MarkdownRenderer
} from '@/components/markdown/markdownrenderer';

import {
  Button
} from '@/components/ui/button';

import {
  Separator
} from '@/components/ui/separator';

import {
  useChatConfig
} from '@/context/chat';

import type {
  ReasoningDetail
} from '@/context/chatsidebar';

import {
  threadMessagesQuery
} from '@/queries';


/**
 * A react component that renders the sidebar reasoning content.
 */
export
function SidebarReasoning(props: SidebarReasoning.Props): ReactNode {
  // Extract the props.
  const { detail, onClose } = props;

  // Fetch the current thread from the chat config.
  const { thread } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the target thread message from the chat.
  const { data: message } = useQuery({
    ...query,
    select: msgs => (
      (msgs ?? []).find(msg =>
        msg.id === detail.messageId &&
        msg.role === 'reasoning'
    ))
  });

  // Bail early if a valid message is not found.
  if (!message) {
    return null;
  }

  // Cast the message to the known type.
  //
  // See the query `select` clause above.
  const msg = message as agui.ReasoningMessage;

  // Return the rendered component.
  return (
    <section>
      <h1 className='p-2 flex flex-row justify-between items-center'>
        <span className='text-xl font-bold'>
          Reasoning
        </span>
        <Button
          className='hover:cursor-pointer'
          variant='ghost'
          onClick={ onClose }>
          <X />
        </Button>
      </h1>
      <Separator />
      <div className='px-2'>
        <MarkdownRenderer content={ msg.content } />
      </div>
    </section>
  );
}


/**
 * The namespace for the `SidebarReasoning` statics.
 */
export
namespace SidebarReasoning {
  /**
   * A type alias for the `SidebarReasoning` props.
   */
  export
  type Props = {
    /**
     * The reasoning detail for the component.
     */
    readonly detail: ReasoningDetail;

    /**
     * A callback to close the sidebar.
     */
    readonly onClose: () => void;
  };
}
