/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

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


/**
 * A type alias for the chat runtime.
 */
export
type ChatRuntime = {
  /**
   * Whether the runtime is currently loading the message history.
   */
  readonly isLoading: boolean;

  /**
   * Whether the runtime is currently running agent input.
   */
  readonly isRunning: boolean;

  /**
   * The messages for the chat.
   */
  readonly messages: readonly agui.Message[];

  /**
   * A callback to submit new input to the agent.
   */
  readonly onInput: (input: agui.RunAgentInput) => void;
};


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

  // Create the query for loading the message history.
  const loadMessages = useQuery({
    queryKey: Private.createQueryKey(chatConfig.threadId),
    queryFn: Private.loadMessages,
    staleTime: 'static',
    placeholderData: []
  });

  // Create the mutation for running the agent.
  const runAgent = useMutation({
    mutationFn: Private.runAgent
  });

  // Create the callback to handle the agent input.
  const handleInput = useCallback((input: agui.RunAgentInput) => {
    runAgent.mutate({ input, chatConfig });
  }, [runAgent.mutate, chatConfig]);

  // Create the chat runtime.
  const runtime: ChatRuntime = {
    isLoading: loadMessages.isFetching,
    isRunning: runAgent.isPending,
    messages: loadMessages.data!,
    onInput: handleInput
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
   * A type alias for the thread messages query key.
   */
  export
  type QueryKey = ['thread.messages', string | undefined];

  /**
   * A function that creates the thread messages query key.
   */
  export
  function createQueryKey(threadId: string | undefined): QueryKey {
    return ['thread.messages', threadId];
  }

  /**
   * A query function which fetches the messages for a thread.
   */
  export
  async function loadMessages(
    context: QueryFunctionContext<QueryKey>
  ): Promise<readonly agui.Message[]> {
    // Extract the query key from the context.
    const { queryKey } = context;

    // Extract the thread id from the query key.
    const threadId = queryKey[1];

    // Bail early if the thread id is undefined.
    if (threadId === undefined) {
      return [];
    }

    // Return the messages from the detail.
    return (await api.getThreadDetail(threadId)).messages;
  }

  /**
   * A type alias for the arguments to `runAgent`.
   */
  export
  type RunAgentArgs = {
    /**
     * The input for runnint the agent.
     */
    readonly input: agui.RunAgentInput;

    /**
     * The current chat config.
     */
    readonly chatConfig: ChatConfig;
  };

  /**
   * A mutation function which runs the agent.
   */
  export
  async function runAgent(
    args: RunAgentArgs, context: MutationFunctionContext
  ): Promise<void> {
    // Extract the args.
    const { input, chatConfig } = args;

    // Extract the thread id.
    const threadId = input.threadId;

    // Extract the agent id.
    const agentId = chatConfig.agentId;

    // Extract the query client.
    const client = context.client;

    // Create the query key for the run.
    const queryKey = createQueryKey(threadId);

    // Seed the query cache with the input messages.
    client.setQueryData<agui.Message[]>(
      queryKey,
      prev => [...(prev ?? []), ...input.messages]
    );

    // Ensure the chat config is synchronized with the session.
    chatConfig.update({ agentId, threadId });

    // Set up the event stream for the run.
    const stream = api.runAgent({ agentId, input });

    // Handle the stream events from the api.
    for await (const evt of stream) {
      client.setQueryData<agui.Message[]>(
        queryKey,
        produce(draft => { processEvent(evt, draft!); })
      );
    }
  }

  /**
   * A type alias for a writeable AUI thread draft.
   */
  type Draft = WritableDraft<agui.Message[]>;

  /**
   * Process an Agno event and add it's effects to the thread draft.
   *
   * @param evt - The Agno run event to process.
   *
   * @param draft - The AUI thread message draft to modify.
   */
  function processEvent(evt: agui.AGUIEvent, draft: Draft): void {
    switch (evt.type) {
    case agui.EventType.TEXT_MESSAGE_START:
      evtTextMessageStart(evt, draft);
      break;
    case agui.EventType.TEXT_MESSAGE_CONTENT:
      evtTextMessageContent(evt, draft);
      break;
    case agui.EventType.TEXT_MESSAGE_END:
      evtTextMessageEnd(evt, draft);
      break;
    case agui.EventType.TEXT_MESSAGE_CHUNK:
      evtTextMessageChunk(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_START:
      evtToolCallStart(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_ARGS:
      evtToolCallArgs(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_END:
      evtToolCallEnd(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_CHUNK:
      evtToolCallChunk(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_RESULT:
      evtToolCallResult(evt, draft);
      break;
    case agui.EventType.STATE_SNAPSHOT:
      evtStateSnapshot(evt, draft);
      break;
    case agui.EventType.STATE_DELTA:
      evtStateDelta(evt, draft);
      break;
    case agui.EventType.MESSAGES_SNAPSHOT:
      evtMessagesSnapshot(evt, draft);
      break;
    case agui.EventType.ACTIVITY_SNAPSHOT:
      evtActivitySnapshot(evt, draft);
      break;
    case agui.EventType.ACTIVITY_DELTA:
      evtActivityDelta(evt, draft);
      break;
    case agui.EventType.RAW:
      evtRaw(evt, draft);
      break;
    case agui.EventType.CUSTOM:
      evtCustom(evt, draft);
      break;
    case agui.EventType.RUN_STARTED:
      evtRunStarted(evt, draft);
      break;
    case agui.EventType.RUN_FINISHED:
      evtRunFinished(evt, draft);
      break;
    case agui.EventType.RUN_ERROR:
      evtRunError(evt, draft);
      break;
    case agui.EventType.STEP_STARTED:
      evtStepStarted(evt, draft);
      break;
    case agui.EventType.STEP_FINISHED:
      evtStepFinished(evt, draft);
      break;
    case agui.EventType.REASONING_START:
      evtReasoningStart(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_START:
      evtReasoningMessageStart(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_CONTENT:
      evtReasoningMessageContent(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_END:
      evtReasoningMessageEnd(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_CHUNK:
      evtReasoningMessageChunk(evt, draft);
      break;
    case agui.EventType.REASONING_END:
      evtReasoningEnd(evt, draft);
      break;
    case agui.EventType.REASONING_ENCRYPTED_VALUE:
      evtReasoningEncryptedValue(evt, draft);
      break;
    default:
      console.error('unhandled ag-ui event', evt);
    }
  }

  /**
   *
   */
  function evtTextMessageStart(evt: agui.TextMessageStartEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtTextMessageContent(evt: agui.TextMessageContentEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtTextMessageEnd(evt: agui.TextMessageEndEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtTextMessageChunk(evt: agui.TextMessageChunkEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtToolCallStart(evt: agui.ToolCallStartEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtToolCallArgs(evt: agui.ToolCallArgsEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtToolCallEnd(evt: agui.ToolCallEndEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtToolCallChunk(evt: agui.ToolCallChunkEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtToolCallResult(evt: agui.ToolCallResultEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtStateSnapshot(evt: agui.StateSnapshotEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtStateDelta(evt: agui.StateDeltaEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtMessagesSnapshot(evt: agui.MessagesSnapshotEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtActivitySnapshot(evt: agui.ActivitySnapshotEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtActivityDelta(evt: agui.ActivityDeltaEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtRaw(evt: agui.RawEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtCustom(evt: agui.CustomEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtRunStarted(evt: agui.RunStartedEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtRunFinished(evt: agui.RunFinishedEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtRunError(evt: agui.RunErrorEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtStepStarted(evt: agui.StepStartedEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtStepFinished(evt: agui.StepFinishedEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningStart(evt: agui.ReasoningStartEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningMessageStart(evt: agui.ReasoningMessageStartEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningMessageContent(evt: agui.ReasoningMessageContentEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningMessageEnd(evt: agui.ReasoningMessageEndEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningMessageChunk(evt: agui.ReasoningMessageChunkEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningEnd(evt: agui.ReasoningEndEvent, draft: Draft): void {

  }

  /**
   *
   */
  function evtReasoningEncryptedValue(evt: agui.ReasoningEncryptedValueEvent, draft: Draft): void {

  }
}
