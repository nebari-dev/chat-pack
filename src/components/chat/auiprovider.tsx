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
  MutationFunctionContext, QueryFunctionContext
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
  const { agent_id, session_id, children } = props;

  // Create and hydrate the thread store.
  const store = Private.useThreadStore({ session_id, agent_id });

  // Create the runtime store adapter.
  const runtime = useExternalStoreRuntime(store);

  // Return the rendered component.
  return (
    <AssistantRuntimeProvider runtime={runtime}>
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
     * The id of the session (thread).
     */
    readonly session_id: string;

    /**
     * The id of the agent for the thread.
     */
    readonly agent_id: string;

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
     * The id of the session (thread).
     */
    readonly session_id: string;

    /**
     * The id of the agent for the thread.
     */
    readonly agent_id: string;
  };

  /**
   * A hook which creates the AUI external store adapter.
   */
  export
  function useThreadStore(
    options: ThreadStoreOptions
  ): ExternalStoreAdapter<ThreadMessageLike> {
    // Extract the options.
    const { session_id, agent_id } = options;

    // Create the query key.
    const queryKey = ['sessions', session_id] as const;

    // Create the mutation key.
    const mutationKey = ['sessions', session_id, agent_id] as const;

    // Create the query.
    const query = useQuery({
      queryKey: queryKey,
      queryFn: loadChatHistory,
      initialData: []
    });

    // Create the mutation.
    const mutation = useMutation({
      mutationKey: mutationKey,
      mutationFn: runUserMessage
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

  // A no-op message converter.
  const noopMessageConverter = <T,>(msg: T) => msg;

  /**
   * A query function which fetches the chat history from the Agno API.
   */
  async function loadChatHistory(
    context: QueryFunctionContext
  ): Promise<readonly ThreadMessageLike[]> {
    // Extract the query key from the context.
    const { queryKey } = context;

    // Extract the session id from the query key.
    const session_id = queryKey[1] as string;

    // Fetch the session data.
    const json = await api.getSessionByID({ session_id });

    // Create the array for the converted messages.
    const messages: ThreadMessageLike[] = [];

    // Convert the chat history into AUI messages.
    for (const msg of json.chat_history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at)
        });
      }
    }

    // Return the converted messages.
    return messages;
  }

  /**
   * A mutation function which runs a user message on the Agno API.
   */
  async function runUserMessage(
    message: AppendMessage, context: MutationFunctionContext
  ): Promise<void> {
    // Extract the client and mutation key from the context.
    const { client, mutationKey } = context;

    // Extract the session and agent id from the mutation key.
    const session_id = mutationKey![1] as string;
    const agent_id = mutationKey![2] as string;

    // Create the query key for updating the client data.
    const queryKey = ['sessions', session_id] as const;

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

    // Append a new user messages.
    client.setQueryData<ThreadMessageLike[]>(
      queryKey,
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
        queryKey,
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
