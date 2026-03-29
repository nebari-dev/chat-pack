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
  MessageRendererMemo
} from './messagerenderer';


/**
 * A react component that renders the chat output for the session.
 */
export
function ChatOutput(): ReactNode {
  // Fetch the current thread from the chat config.
  const { thread } = useChatConfig();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the thread messages for the chat.
  const { data: messages } = useQuery(query);

  // Create the content for the thread.
  const content = (messages ?? []).map(msg =>
    <MessageRendererMemo key={ msg.id } message={ msg } />
  );

  // Return the rendered component.
  return (
    <div className='grow mx-auto w-full min-w-3xs max-w-3xl'>
      { content }
    </div>
  );
}
