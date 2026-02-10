/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  MutationFunctionContext, QueryFunctionContext
} from '@tanstack/react-query';

import {
  useMutation, useQuery
} from '@tanstack/react-query';

import type {
  WritableDraft
} from 'immer';

import {
  produce
} from 'immer';

import type {
  PropsWithChildren, ReactNode
} from 'react';

import {
  createContext, useCallback, useContext
} from 'react';

import * as api from '@/api';

import type {
  ChatConfig
} from '@/context';

import {
  useChatConfig
} from '@/context';

import type {
  ReadonlyJSONObject
} from '@/lib/json';


/**
 * A type alias for the chat runtime.
 */
export
type ChatRuntime = {
  /**
   * Whether the runtime is currently loading the chat history.
   */
  readonly isLoading: boolean;

  /**
   * Whether the runtime is currently running an user prompt.
   */
  readonly isRunning: boolean;

  /**
   * The session runs for the chat.
   */
  readonly runs: readonly api.SessionRun[];

  /**
   * A callback to submit a new user message to the session.
   */
  readonly onUserSubmit: (prompt: string) => void;

  /**
   * A callback to continue a run after a HITL tool pause.
   */
  readonly onContinueRun: (options: ChatRuntime.ContinueRunOptions) => void;
};


/**
 * The namespace for the `ChatRuntime` statics.
 */
export
namespace ChatRuntime {
  /**
   * A type alias for the `onContinueRun()` options.
   */
  export
  type ContinueRunOptions = {
    /**
     * The unique id of the run to continue.
     */
    readonly runId: string;

    /**
     * The id of the form that has been completed.
     */
    readonly formId: string;

    /**
     * The completed data for the form.
     */
    readonly formData: ReadonlyJSONObject;
  };
}


/**
 * The chat runtime context.
 *
 * This is explicitly not exported.
 *
 * Use the `ChatRuntimeProvider` component instead.
 */
const ChatRuntimeContext = createContext<ChatRuntime | undefined>(undefined);


/**
 * A hook which returns the chat runtime.
 */
export
function useChatRuntime(): ChatRuntime {
  const runtime = useContext(ChatRuntimeContext);
  if (runtime === undefined) {
    throw new Error('`useChatRuntime` must be called within a `ChatRuntimeProvider`');
  }
  return runtime;
}


/**
 * The chat runtime provider component.
 */
export
function ChatRuntimeProvider(props: PropsWithChildren): ReactNode {
  // Fetch the chat config.
  const chatConfig = useChatConfig();

  // Create the runs query.
  const loadRuns = useQuery({
    queryKey: Private.createQueryKey(chatConfig.sessionId),
    queryFn: Private.loadRuns,
    staleTime: 'static',
    placeholderData: []
  });

  // Create the mutation for creating runs.
  const createRun = useMutation({
    mutationFn: Private.createRun
  });

  // Create the mutation for continuing runs.
  const continueRun = useMutation({
    mutationFn: Private.continueRun
  });

  // Create the callback to handle the user submit.
  const handleUserSubmit = useCallback((prompt: string) => {
    createRun.mutate({ prompt, chatConfig });
  }, [createRun.mutate, chatConfig]);

  // Create the callback from resuming a run after it is paused..
  const handleContinueRun = useCallback((options: ChatRuntime.ContinueRunOptions) => {
    continueRun.mutate({ options, chatConfig });
  }, [continueRun.mutate]);

  // Create the chat runtime.
  const runtime: ChatRuntime = {
    isLoading: loadRuns.isFetching,
    isRunning: createRun.isPending || continueRun.isPending,
    runs: loadRuns.data!,
    onUserSubmit: handleUserSubmit,
    onContinueRun: handleContinueRun
  };

  // Return the rendered component.
  return (
    <ChatRuntimeContext value={ runtime }>
      { props.children }
    </ChatRuntimeContext>
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
  type QueryKey = ['session-runs', string | undefined];

  /**
   * A function that creates the session query key.
   */
  export
  function createQueryKey(sessionId: string | undefined): QueryKey {
    return ['session-runs', sessionId];
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

  /**
   * A type alias for the arguments to `createRun`.
   */
  export
  type CreateRunArgs = {
    /**
     * The user prompt for starting the run.
     */
    readonly prompt: string;

    /**
     * The current chat config.
     */
    readonly chatConfig: ChatConfig;
  };

  /**
   * A mutation function which runs a user message on the Agno API.
   */
  export
  async function createRun(
    args: CreateRunArgs, context: MutationFunctionContext
  ): Promise<void> {
    // Extract the args.
    const { prompt, chatConfig } = args;

    // Extract the agent id.
    const agentId = chatConfig.agentId;

    // Extract the query client.
    const client = context.client;

    // Extract or create the session id.
    const sessionId = chatConfig.sessionId ?? crypto.randomUUID();

    // Create the query key for the run.
    const queryKey = createQueryKey(sessionId);

    // Seed the query cache with a new empty run.
    //
    // TODO - the api should allow the client to provide the new run id.
    // The Agno backend does not allow this, so we have to use an empty
    // run id and then patch it on the first run-started event.
    client.setQueryData<api.SessionRun[]>(
      queryKey,
      prev => [...(prev ?? []), {
        agentId,
        createdAt: '',
        events: [],
        prompt,
        runId: ''
      }]
    );

    // Ensure the chat config is synchronized with the session.
    chatConfig.update({ agentId, sessionId });

    // Set up the event stream for the Agno API.
    const stream = api.createRun({ sessionId, agentId, prompt });

    // Handle the stream events from the Agno API.
    for await (const evt of stream) {
      client.setQueryData<api.SessionRun[]>(
        queryKey,
        produce(draft => { processEvent(evt, draft!); })
      );
    }
  }

  /**
   * A type alias for the arguments to `continueRun`.
   */
  export
  type ContinueRunArgs = {
    /**
     * The options for continuing the run.
     */
    readonly options: ChatRuntime.ContinueRunOptions;

    /**
     * The current chat config.
     */
    readonly chatConfig: ChatConfig;
  };

  /**
   * A mutation function which continues a run after HITL interaction.
   */
  export
  async function continueRun(
    args: ContinueRunArgs, context: MutationFunctionContext
  ): Promise<void> {
    // // Extract the args.
    // const { options, chatConfig } = args;

    // // Extract the query client.
    // const client = context.client;

    // // Create the query key for updating the run.
    // const queryKey = createQueryKey(sessionId);

    // // Set up the event stream for the Agno API.
    // const stream = api.continueAgentRun({
    //   agent_id: agentId,
    //   run_id: runId,
    //   session_id: sessionId,
    //   tools
    // });

    // // Handle the stream events from the Agno API.
    // for await (const evt of stream) {
    //   client.setQueryData<api.SessionRuns>(
    //     queryKey,
    //     produce(draft => { processEvent(evt, draft!); })
    //   );
    // }
  }

  /**
   * A type alias for a writeable AUI thread draft.
   */
  type Draft = WritableDraft<api.SessionRun[]>;

  /**
   * Process an Agno event and add it's effects to the thread draft.
   *
   * @param evt - The Agno run event to process.
   *
   * @param draft - The AUI thread message draft to modify.
   */
  function processEvent(evt: api.RunEvent, draft: Draft): void {
    // Patch the creation time and run id on run started.
    //
    // TODO this clause can be eliminated when the backend API supports
    // allowing the client to specify a new run id. This logic is not
    // perfect, but it's good enough for now if the backend behaves.
    if (evt.type === 'run-started') {
      const run = draft[draft.length - 1];
      run.createdAt = evt.createdAt;
      run.runId = evt.runId;
    }

    // Find the matching run for the event.
    //
    // This should be a quick match to the most recent run.
    const run = draft.findLast(run => run.runId === evt.runId);

    // Throw an error if the run is not found.
    if (!run) {
      throw new Error(`Run id ${evt.runId} not found`);
    }

    // Add the event to the run events array.
    run.events.push(evt);
  }
}
