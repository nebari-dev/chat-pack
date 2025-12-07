/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  AppendMessage, ThreadMessageLike, TextMessagePart, ToolCallMessagePart
} from '@assistant-ui/react';

import type {
  MutationFunctionContext, QueryClient, QueryFunctionContext
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

import {
  useCallback
} from 'react';

import * as api from '@/api';

import type {
  ChatConfig
} from './chatconfigprovider';

import {
  useChatConfig
} from './chatconfigprovider';


/**
 * A type alias for the result of the `useThreadMessages` hoook.
 */
export
type UseThreadMessagesResult = {
  /**
   * The messages in the thread.
   */
  readonly messages: readonly ThreadMessageLike[];

  /**
   * Whether the messages are currently being fetched from the server.
   */
  readonly isFetching: boolean;

  /**
   * Whether the `onNewCallback` is currently running.
   */
  readonly isPending: boolean;

  /**
   * A callback to post a new user message and start a run.
   */
  readonly onNewCallback: (message: AppendMessage) => Promise<void>
};


/**
 * A hook for managing the current AUI chat thread.
 */
export
function useThreadMessages(): UseThreadMessagesResult {
  // Fetch the chat config.
  const config = useChatConfig();

  // Create the history query.
  const { data, isFetching } = useQuery({
    queryKey: Private.createQueryKey(config.sessionId),
    queryFn: Private.loadHistory,
    staleTime: 'static',
    placeholderData: []
  });

  // Create the mutation for creating runs.
  const { isPending, mutateAsync } = useMutation({
    mutationFn: Private.createRun
  });

  // Create the callback for running a new AUI user message.
  const onNewCallback = useCallback(async (message: AppendMessage) => {
    await mutateAsync({ message, config });
  }, [mutateAsync, config]);

  // Return the results.
  return { messages: data!, isFetching, isPending, onNewCallback };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the thread query key.
   */
  export
  type QueryKey = ['thread', string | undefined];

  /**
   * A function that creates the thread query key.
   */
  export
  function createQueryKey(sessionId: string | undefined): QueryKey {
    return ['thread', sessionId];
  }

  /**
   * A query function which fetches the chat history from the Agno API.
   */
  export
  async function loadHistory(
    context: QueryFunctionContext<QueryKey>
  ): Promise<readonly ThreadMessageLike[]> {
    // Extract the query key from the context.
    const { queryKey } = context;

    // Extract the session id from the query key.
    const sessionId = queryKey[1];

    // Bail early if the session id is undefined.
    if (sessionId === undefined) {
      return [];
    }

    // Fetch the runs from the server.
    const runs = await api.getSessionRuns(sessionId);

    // Convert the runs to thread messages.
    const messages = runs.map(convertRun);

    // Return the flattened messages.
    return messages.flat();
  }

  /**
   * A type alias for the arguments to `createRun`.
   */
  export
  type CreateRunArgs = {
    /**
     * The user message for starting the run.
     */
    readonly message: AppendMessage;

    /**
     * The current chat config.
     */
    readonly config: ChatConfig;
  };

  /**
   * A mutation function which runs a user message on the Agno API.
   */
  export
  async function createRun(
    args: CreateRunArgs, context: MutationFunctionContext
  ): Promise<void> {
    // Extract the args.
    const { message, config } = args;

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

    // Bail early for unhandled chat types.
    //
    // TODO handle other chat types.
    if (config.type !== 'agent') {
      throw new Error(`Unhandled chat type: ${config.type}`);
    }

    // Bail early if no agent is defined.
    if (!config.agentId) {
      throw new Error('missing agent id');
    }

    // Extract the query client.
    const client = context.client;

    // Create a new session if needed.
    const sessionId = await maybeCreateSession(config, client);

    // Create the query key for the run.
    const queryKey = createQueryKey(sessionId);

    // Initialize the cache with the user message.
    client.setQueryData<ThreadMessageLike[]>(
      queryKey,
      produce(draft => {
        draft!.push({
          role: 'user',
          content: [{ type: 'text', text: part.text }],
          createdAt: message.createdAt
        });
      })
    );

    // Set up the event stream for the Agno API.
    const stream = api.createAgentRun({
      session_id: sessionId,
      agent_id: config.agentId,
      message: part.text
    });

    // Handle the stream events from the Agno API.
    for await (const evt of stream) {
      client.setQueryData<ThreadMessageLike[]>(
        queryKey,
        produce(draft => { processEvent(evt, draft!); })
      );
    }
  }

  /**
   * Convert an Agno run into AUI thread messages.
   *
   * @param run - The Agno api run of interest.
   *
   * @returns An array of AUI thread messages for the run.
   */
  function convertRun(run: api.Run): ThreadMessageLike[] {
    // Create the user message.
    const user = createUserMessage(run);

    // Create the assistant message.
    const assistant = createAssistantMessage(run);

    // Return the AUI messages.
    return [user, assistant];
  }

  /**
   * Create the AUI user message for an Agno run.
   *
   * @param run - The Agno api run of interest.
   *
   * @returns The AUI user message for the run.
   */
  function createUserMessage(run: api.Run): ThreadMessageLike {
    return {
      role: 'user',
      content: [createTextPart(run.run_input)],
      createdAt: new Date(run.created_at)
    };
  }

  /**
   * Create the AUI assistant message for an Agno run.
   *
   * @param run - The Agno api run of interest.
   *
   * @returns The AUI assistant message for the run.
   */
  function createAssistantMessage(run: api.Run): ThreadMessageLike {
    // Create the tool call parts.
    const tools = (run.tools ?? []).map(createToolCallPart);

    // Create the text part.
    const text = createTextPart(run.content);

    // Return the assistant message.
    return {
      role: 'assistant',
      content: [...tools, text],
      createdAt: new Date(run.created_at)
    };
  }

  /**
   * Create an AUI tool call part from an Agno tool call.
   *
   * @param tool - The Agno api tool call.
   *
   * @returns The equivalent AUI tool call part.
   */
  function createToolCallPart(tool: api.ToolCall): ToolCallMessagePart {
    return {
      type: 'tool-call',
      toolCallId: tool.tool_call_id,
      toolName: tool.tool_name,
      args: tool.tool_args as {},
      argsText: JSON.stringify(tool.tool_args),
      result: tool.result
    };
  }

  /**
   * Create the AUI assistant text part for an Agno run.
   *
   * @param content - The content for the text part.
   *
   * @returns The AUI assistant text part for the run.
   */
  function createTextPart(content: string): TextMessagePart {
    return { type: 'text', text: content };
  }

  /**
   * Create new session if one is not defined on the chat config.
   *
   * @param config - The current chat config.
   *
   * @param client - The query client.
   *
   * @returns The pre-existing or newly-created session id.
   */
  async function maybeCreateSession(
    config: ChatConfig, client: QueryClient
  ): Promise<string> {
    // If the session id already exists, return that id.
    if (config.sessionId !== undefined) {
      return config.sessionId;
    }

    // Create a new session on the server.
    const resp = await api.createSession();

    // Extract the session id from the response.
    const sessionId = resp.session_id;

    // Initialize the query cache for the new session.
    client.setQueryData(createQueryKey(sessionId), []);

    // Update the config with the new session id.
    config.setSessionId(sessionId);

    // Return the new session id.
    return sessionId;
  }

  /**
   * A type alias for a writeable AUI thread draft.
   */
  type Draft = WritableDraft<ThreadMessageLike>[];

  /**
   * Process an Agno event and add it's effects to the thread draft.
   *
   * @param evt - The Agno run event to process.
   *
   * @param draft - The AUI thread message draft to modify.
   */
  function processEvent(evt: api.RunEvent, draft: Draft): void {
    switch (evt.event) {
    case 'RunStarted':
      evtRunStarted(evt, draft);
      break;
    case 'RunContent':
      evtRunContent(evt, draft);
      break;
    case 'RunContentCompleted': // no need to handle this event
      break;
    case 'RunCompleted': // no need to handle this event
      break
    case 'ToolCallStarted':
      evtToolCallStarted(evt, draft);
      break;
    case 'ToolCallCompleted':
      evtToolCallCompleted(evt, draft);
      break;
    default:
      console.log('unhandled run event', evt);
    }
  }

  /**
   * Handle the `RunStarted` Agno event.
   */
  function evtRunStarted(evt: api.RunStartedEvent, draft: Draft): void {
    // Create the timestamp for the new message.
    const createdAt = new Date(evt.created_at);

    // Create a new assistant message with an empty content array.
    draft.push({ role: 'assistant', createdAt, content: [] });
  }

  /**
   * Handle the `RunContent` Agno event.
   */
  function evtRunContent(evt: api.RunContentEvent, draft: Draft): void {
    // Find the most recent assistant content.
    const content = findLastAssistantContent(draft);

    // Bail if the content was not found.
    if (!content) {
      return;
    }

    // Find the most recent text part.
    const part = content.findLast(part => part.type === 'text');

    // Update the text message part, or create a new one.
    if (part) {
      part.text += evt.content;
    } else {
      content.push({ type: 'text', text: evt.content });
    }
  }

  /**
   * Handle the `ToolCallStarted` Agno event.
   */
  function evtToolCallStarted(
    evt: api.ToolCallStartedEvent, draft: Draft
  ): void {
    // Find the most recent assistant content.
    const content = findLastAssistantContent(draft);

    // Bail if the content was not found.
    if (!content) {
      return;
    }

    // Find the insert location for the tool call.
    //
    // Part ordering is [...tool-parts, text-part]
    const i = content.findLastIndex(part => part.type === 'tool-call') + 1;

    // Create the tool call part.
    const part: ToolCallMessagePart = {
      type: 'tool-call',
      toolCallId: evt.tool.tool_call_id,
      toolName: evt.tool.tool_name,
      args: evt.tool.tool_args as {},
      argsText: JSON.stringify(evt.tool.tool_args),
      result: ''
    };

    // Insert the tool part into the content.
    //
    // The cast is needed to prevent TS "excessively deep type insantiation"
    // errors. Likely because `ToolCallMessagePart` recursively references
    // the `ThreadMessage` type, but I'm not entirely sure right now.
    (content as any[]).splice(i, 0, part);
  }

  /**
   * Handle the `ToolCallCompleted` Agno event.
   */
  function evtToolCallCompleted(
    evt: api.ToolCallCompletedEvent, draft: Draft
  ): void {
    // Find the most recent assistant content.
    const content = findLastAssistantContent(draft);

    // Bail if the content was not found.
    if (!content) {
      return;
    }

    // Find the matching tool call part.
    const part = content.find(part =>
      part.type === 'tool-call' && part.toolCallId === evt.tool.tool_call_id
    );

    // Log an error if the part is not found.
    if (!part) {
      console.error(`Assistant tool call not found: ${evt.tool.tool_call_id}`);
      return;
    }

    // We already know `type` is 'tool-call', but TS fails to fully narrow
    // the type in the call to `find()` above, and attempting to cast to
    // `ToolCallMessagePart` type triggers an "excessively deep type
    // instantiation" error. I haven't found a better workaround yet.
    if (part.type !== 'tool-call') {
      return;
    }

    // Update the result of the tool call.
    part.result = evt.tool.result;
  }

  /**
   * Find the the content array for the most recent 'assistant' message.
   *
   * This logs an error and returns `null` if something goes wrong.
   *
   * The return type is complex, so it is left as automatically inferred.
   */
  function findLastAssistantContent(draft: Draft) {
    // Find the most recent assistant message.
    const msg = draft.findLast(msg => msg.role === 'assistant');

    // Log an error if the message is not found.
    if (!msg) {
      console.error('Internal: assistant message not found');
      return null;
    }

    // Fetch the message content.
    const content = msg.content;

    // Log an error if the content is not an array.
    if (typeof content === 'string') {
      console.error('Internal: unexpected message content type');
      return null;
    }

    // Return the content array.
    return content;
  }
}
