/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useQuery
} from '@tanstack/react-query';

import type {
  ReactNode
} from 'react';

import {
  useChatConfig
} from '@/context';

import {
  threadMessagesQuery
} from '@/queries';

import {
  SidebarReasoning
} from './sidebarreasoning';

import {
  SidebarTools
} from './sidebartools';


/**
 * A react component that renders the chat sidebar detail.
 */
export
function ChatSidebar(): ReactNode {
  // Fetch the thread and detail id from the chat sidebar config.
  const { thread, detailId } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the detail target message from the thread.
  const { data: message } = useQuery({
    ...query,
    select: msgs => (
      detailId ? (msgs ?? []).find(msg => msg.id === detailId) : undefined
    )
  });

  // Bail early if there is no message to render.
  if (!message) {
    return null;
  }

  // Create the variable to the hold the content.
  let content: ReactNode;

  // Dispatch on the detail type.
  switch (message.role) {
  case 'reasoning':
    content = <SidebarReasoning message={ message } />;
    break
  case 'assistant':
    content = <SidebarTools message={ message } />;
    break;
  default:
    content = null;
  }

  // Bail early if there is no content to render.
  if (!content) {
    return null;
  }

  // Return the rendered component.
  return (
    <div className='w-160 border-l overflow-y-auto'>
      { content }
    </div>
  );
}
