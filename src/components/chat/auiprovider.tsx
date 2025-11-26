/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  AppendMessage, ExternalStoreAdapter, ThreadMessageLike
} from '@assistant-ui/react';

import {
  AssistantRuntimeProvider, useExternalStoreRuntime
} from '@assistant-ui/react';

import type {
  MutationFunctionContext, QueryClient, QueryFunctionContext
} from '@tanstack/react-query';

import {
  useMutation, useQuery
} from '@tanstack/react-query';

import {
  produce
} from 'immer';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';


/**
 * An Assistant-UI runtime provider for a single chat session.
 */
export
function AUIProvider(props: AUIProvider.Props): ReactNode {
  // Extract the props.
  const { session_id, agent_id, setSessionId, children } = props;

  // Create and hydrate the thread store.
  const store = Private.useThreadStore({ session_id, agent_id, setSessionId });

  // Create the runtime store adapter.
  const runtime = useExternalStoreRuntime(store);

  // Return the rendered component.
  return (
    <AssistantRuntimeProvider runtime={ runtime }>
      { children }
    </AssistantRuntimeProvider>
  );
}


/**
 * The namespace for the `AUIProvider` statics.
 */
export
namespace AUIProvider {
  /**
   * The props for `AUIProvider`.
   */
  export
  type Props = {
    /**
     * The unique id of the session (thread).
     *
     * If this is `undefined` a new session will be created on the first
     * user messages and `setSessionId` will be invoked.
     *
     * If this is provided, the session is assumed to exist on the server.
     */
    readonly session_id: string | undefined;

    /**
     * The id of the agent for processing user messages.
     */
    readonly agent_id: string;

    /**
     * A callback to set the id for a new session.
     */
    readonly setSessionId: (session_id: string) => void;

    /**
     * The children for the provider.
     */
    readonly children?: ReactNode;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The options for the `useThreadStore` hook.
   */
  export
  type ThreadStoreOptions = {
    /**
     * The unique id of the session (thread).
     *
     * If this is `undefined` a new session will be created on the first
     * user messages and `setSessionId` will be invoked.
     *
     * If this is provided, the session is assumed to exist on the server.
     */
    readonly session_id: string | undefined;

    /**
     * The id of the agent for processing user messages.
     */
    readonly agent_id: string;

    /**
     * A callback to set the id for a new session.
     */
    readonly setSessionId: (session_id: string) => void;
  };

  /**
   * A hook which creates the AUI external store adapter.
   */
  export
  function useThreadStore(
    options: ThreadStoreOptions
  ): ExternalStoreAdapter<ThreadMessageLike> {
    // Create the query.
    const query = useQuery({
      queryKey: createQueryKey(options.session_id),
      queryFn: loadChatHistory,
      staleTime: 'static',
      placeholderData: []
    });

    // Create the mutation.
    const mutation = useMutation({
      mutationFn: runUserMessage,
      meta: options
    });

    // Return the store adapter.
    return {
      messages: query.data,
      isLoading: query.isFetching,
      isRunning: mutation.isPending,
      onNew: mutation.mutateAsync,
      convertMessage: noopMessageConverter
    };
  }

  /**
   * A no-op message converter.
   *
   * This make the AUI store adapter api happy.
   */
  const noopMessageConverter = <T,>(msg: T) => msg;

  /**
   * The various types of a chat query key.
   */
  type QueryKey = readonly ['chat', string];
  type NullQueryKey = readonly ['chat', undefined];
  type MaybeQueryKey = readonly ['chat', string | undefined];

  /**
   * A function that creates a chat query key for a session.
   */
  function createQueryKey(session_id: string): QueryKey;
  function createQueryKey(session_id: undefined): NullQueryKey;
  function createQueryKey(session_id: string | undefined): MaybeQueryKey
  function createQueryKey(session_id: string | undefined): MaybeQueryKey {
    return ['chat', session_id];
  }

  /**
   * A function which converts an Agno history message to an AUI message.
   *
   * @param messge - The Agno chat history message.
   *
   * @returns The AUI equivalent message, or `null` if it can't be converted.
   *
   * TODO - Handle more Agno message types.
   */
  function convertChatHistoryMessage(
    message: api.ChatHistoryMessage
  ): ThreadMessageLike | null {
    if (message.role === 'user' || message.role === 'assistant') {
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: message.content,
          createdAt: new Date(message.created_at)
        };
      }
    }
    return null;
  };

  /**
   * A query function which fetches the chat history from the Agno API.
   */
  async function loadChatHistory(
    context: QueryFunctionContext<MaybeQueryKey>
  ): Promise<readonly ThreadMessageLike[]> {
    // Extract the query key from the context.
    const { queryKey } = context;

    // Extract the session id from the query key.
    const session_id = queryKey[1];

    // Return an empty array if the sesssion id is undefined.
    if (session_id === undefined) {
      return [];
    }

    // Fetch the chat history.
    const { chat_history } = await api.getSessionByID({ session_id });

    // Return the converted and filtered result.
    return chat_history
      .map(convertChatHistoryMessage)
      .filter(msg => msg !== null);
  }

  /**
   * A function which ensures a session is created on the server and that
   * the query cache is populated with an initial array.
   *
   * @param session_id - The id for the session. If this is `undefined`,
   *   a new session will be created on the server, and the query cache
   *   will be populated with an array. If this is already a `string`,
   *   this function is a no-op.
   *
   * @param client - The query client to use for updated the query cache.
   *
   * @returns The resolved session id.
   */
  async function ensureSession(
    session_id: string | undefined, client: QueryClient
  ): Promise<string> {
    // Bail early if the session already exists.
    //
    // This assumes the session exists on the server.
    if (session_id !== undefined) {
      return session_id;
    }

    // Create a new session on the server.
    session_id = await api.createSession();

    // Populate the query cache for the session.
    client.setQueryData(createQueryKey(session_id), prev => prev ?? []);

    // Return the resolved session id.
    return session_id;
  }

  /**
   * A mutation function which runs a user message on the Agno API.
   */
  async function runUserMessage(
    message: AppendMessage, context: MutationFunctionContext
  ): Promise<void> {
    // Bail early if the content length is unexpected.
    if (message.content.length !== 1) {
      throw new Error(`Unhandled content length: ${message.content.length}`);
    }

    // Extract the single message part.
    const part = message.content[0];

    // Bail early if the content part type is unexpected.
    if (part.type !== 'text') {
      throw new Error(`Unhandled part type: ${part.type}`);
    }

    // Extract the client from the context.
    const client = context.client;

    // Extract the metadata from the context.
    const {
      session_id: $session_id, agent_id, setSessionId
    } = context.meta as ThreadStoreOptions;

    // Ensure the session and query cache exists.
    const session_id = await ensureSession($session_id, client);

    // Ensure the page is pointing to the current session.
    setSessionId(session_id);

    // Append a new user messages.
    client.setQueryData<ThreadMessageLike[]>(
      createQueryKey(session_id),
      produce(draft => {
        draft!.push({
          role: 'user',
          content: part.text,
          createdAt: message.createdAt
        });
      })
    );

    // Set up the event stream for the Agno API.
    const stream = api.runAgent({ session_id, agent_id, message: part.text });

    // Handle the stream events from the Agno API.
    for await (const evt of stream) {
      client.setQueryData<ThreadMessageLike[]>(
        createQueryKey(session_id),
        produce(draft => {
          // Handle the `RunStarted` event.
          if (evt.event === 'RunStarted') {
            // Create a new empty assistant message when the run is started.
            draft!.push({
              role: 'assistant',
              id: evt.run_id,
              createdAt: new Date(evt.created_at),
              content: '' // TODO support other content types
            });

            // Nothing more to do.
            return;
          }

          // Handle the `RunContent` event.
          if (evt.event === 'RunContent') {
            // Find the most recent matching assistant message.
            const msg = draft!.findLast(m =>
              m.role === 'assistant' && m.id === evt.run_id
            );

            // If the message is found, append the content.
            if (msg) {
              msg.content += evt.content; // TODO support other content types
            } else {
              console.error(`Assistant message not found: ${evt.run_id}`);
            }

            // Nothing more to do.
            return;
          }

          // Handle the `RunCompleted` event.
          if (evt.event === 'RunCompleted') {
            // Find the most recent matching assistant message.
            const msg = draft!.findLast(m =>
              m.role === 'assistant' && m.id === evt.run_id
            );

            // If the message is found, replace the full content.
            if (msg) {
              msg.content = evt.content; // TODO support other content types
            } else {
              console.error(`Assistant message not found: ${evt.run_id}`);
            }

            // Nothing more to do.
            return;
          }

          // TODO handle more event types.
        })
      );
    }
  }
}
