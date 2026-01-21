/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  QueryFunctionContext
} from '@tanstack/react-query';

import {
  useQuery
} from '@tanstack/react-query';

import type {
  PropsWithChildren, ReactNode
} from 'react';

import {
  useCallback
} from 'react';

import * as api from '@/api';

import {
  useChatConfig
} from './chatconfigprovider';

import type {
  ChatRuntime
} from './chatruntimeprovider';

import {
  ChatRuntimeProvider
} from './chatruntimeprovider';


/**
 * The chat provider component.
 *
 * This component wraps its children in the `ChatRuntimeProvider`
 * and provides the primary message orchestration functionality.
 */
export
function ChatProvider(props: PropsWithChildren): ReactNode {
  // Fetch the chat config.
  const config = useChatConfig();

  // Create the runs query.
  const loadRuns = useQuery({
    queryKey: Private.createQueryKey(config.sessionId),
    queryFn: Private.loadRuns,
    staleTime: 'static',
    placeholderData: []
  });

  //
  const handleUserSubmit = useCallback((prompt: string) => {
    console.log('user submit', prompt);
  }, []);

  //
  const runtime: ChatRuntime = {
    ...config,
    runs: loadRuns.data!,
    onUserSubmit: handleUserSubmit
  };

  // Return the rendered component.
  return (
    <ChatRuntimeProvider value={ runtime }>
      { props.children }
    </ChatRuntimeProvider>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the session query key.
   */
  export
  type QueryKey = ['session', string | undefined];

  /**
   * A function that creates the session query key.
   */
  export
  function createQueryKey(sessionId: string | undefined): QueryKey {
    return ['session', sessionId];
  }

  /**
   * A query function which fetches the runs for a session.
   */
  export
  async function loadRuns(
    context: QueryFunctionContext<QueryKey>
  ): Promise<readonly api.SessionRun[]> {
    // Extract the query key from the context.
    const { queryKey } = context;

    // Extract the session id from the query key.
    const sessionId = queryKey[1];

    // Bail early if the session id is undefined.
    if (sessionId === undefined) {
      return [];
    }

    // Fetch the runs from the server.
    return await api.getSessionRuns(sessionId);
  }
}
