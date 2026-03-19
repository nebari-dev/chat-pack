/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import type {
  MutationFunctionContext
} from '@tanstack/react-query';

import {
  mutationOptions, queryOptions
} from '@tanstack/react-query';

import type {
  WritableDraft
} from 'immer';

import {
  produce
} from 'immer';

import * as api from '@/api';


/**
 * A query for fetching a thread by id.
 */
export
const threadQuery = (id: string | undefined) => {
  return queryOptions({
    queryKey: ['thread', id],
    queryFn: () => id ? api.getThread(id) : null,
    staleTime: 1000 * 60 * 5 // 5min
  });
};


/**
 * A query for fetching a page of threads.
 */
export
const threadPageQuery = (options: api.getThreadPage.Options) => {
  return queryOptions({
    queryKey: ['threads', options],
    queryFn: () => api.getThreadPage(options),
    staleTime: 1000 * 60 * 5 // 5min
  });
};


/**
 * A mutation for deleting threads.
 */
export
const deleteThreadsMutation = mutationOptions({
  mutationFn: (ids: readonly string[]) => {
    return api.deleteThreads(ids);
  },
  onSuccess: (_, __, ___, context) => {
    context.client.invalidateQueries({ queryKey: ['threads'] });
  },
  onError: console.error.bind(console)
});


/**
 * A query for fetching thread messages by thread id.
 */
export
const threadMessagesQuery = (id: string | undefined) => {
  return queryOptions({
    queryKey: ['thread', 'messages', id],
    queryFn: () => id ? api.getThreadMessages(id) : null,
    staleTime: 1000 * 60 * 5 // 5min
  });
};


/**
 * A mutation for creating a new thread.
 */
export
const createThreadMutation = mutationOptions({
  mutationFn: (options: api.createThread.Options) => {
    return api.createThread(options);
  },
  onSuccess: (thread, _, __, context) => {
    const threadKey = ['thread', thread.id];
    const messagesKey = ['thread', 'messages', thread.id];
    context.client.setQueryData<api.Thread>(threadKey, thread);
    context.client.setQueryData<api.ThreadMessages>(messagesKey, []);
    context.client.invalidateQueries({ queryKey: ['threads'] });
  },
  onError: console.error.bind(console)
});


/**
 * A mutation for creating a run in an existing thread.
 */
export
const createRunMutation = mutationOptions({
  mutationFn: createRun,
  onError: console.error.bind(console)
});


/**
 * The namespace for the module implementation details.
 */
// namespace Private {
  /**
   * A mutation function to create a run in an existing thread.
   */
  export
  async function createRun(
    options: api.createRun.Options,
    context: MutationFunctionContext
  ): Promise<void> {
    // Create the query key for the thread messages.
    const queryKey = ['thread', 'messages', options.threadId];

    // Optimistically update the query cache with the new messages.
    context.client.setQueryData<api.ThreadMessages>(
      queryKey,
      prev => [...(prev ?? []), ...options.messages]
    );

    // Create the event stream for the run.
    const stream = api.createRun(options);

    // Handle the events from the stream.
    for await (const evt of stream) {
      context.client.setQueryData<api.ThreadMessages>(
        queryKey,
        produce(draft => { processEvent(evt, draft!); })
      );
    }
  }

  /**
   * A type alias for a writable draft of thread messages.
   */
  type Draft = WritableDraft<api.ThreadMessages>;

  /**
   * Dispatch an ag-ui event to the appropriate event handler.
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
      // evtTextMessageEnd(evt, draft);
      break;
    case agui.EventType.TEXT_MESSAGE_CHUNK:
      // Chunk events are just a more complicated way of expressing
      // start -> content -> end. Don't support them.
      console.log('`TextMessageChunk` events are not supported');
      break;
    case agui.EventType.TOOL_CALL_START:
      // evtToolCallStart(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_ARGS:
      // evtToolCallArgs(evt, draft);
      break;
    case agui.EventType.TOOL_CALL_END:
      // Ignored until needed
      break;
    case agui.EventType.TOOL_CALL_CHUNK:
      // Chunk events are just a more complicated way of expressing
      // start -> content -> end. Don't support them.
      console.log('`ToolCallChunk` events are not supported');
      break;
    case agui.EventType.TOOL_CALL_RESULT:
      // evtToolCallResult(evt, draft);
      break;
    case agui.EventType.STATE_SNAPSHOT:
      // State events have no real meaning or use to the UI.
      // Don't support them.
      console.log('`StateSnapshot` events are not supported');
      break;
    case agui.EventType.STATE_DELTA:
      // State events have no real meaning or use to the UI.
      // Don't support them.
      console.log('`StateDelta` events are not supported');
      break;
    case agui.EventType.MESSAGES_SNAPSHOT:
      evtMessagesSnapshot(evt, draft);
      break;
    case agui.EventType.ACTIVITY_SNAPSHOT:
      // evtActivitySnapshot(evt, draft);
      break;
    case agui.EventType.ACTIVITY_DELTA:
      // evtActivityDelta(evt, draft);
      break;
    case agui.EventType.RAW:
      // Ingored until needed
      break;
    case agui.EventType.CUSTOM:
      // Ignored until needed
      break;
    case agui.EventType.RUN_STARTED:
      // Ignored until needed
      break;
    case agui.EventType.RUN_FINISHED:
      // Ignored until needed
      break;
    case agui.EventType.RUN_ERROR:
      // Just log it for now
      console.error(evt);
      break;
    case agui.EventType.STEP_STARTED:
      // Ignored until needed. There is no corresponding step message.
      break;
    case agui.EventType.STEP_FINISHED:
      // Ignored until needed. There is no corresponding step message.
      break;
    case agui.EventType.REASONING_START:
      // evtReasoningStart(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_START:
      // evtReasoningMessageStart(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_CONTENT:
      // evtReasoningMessageContent(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_END:
      // evtReasoningMessageEnd(evt, draft);
      break;
    case agui.EventType.REASONING_MESSAGE_CHUNK:
      // Chunk events are just a more complicated way of expressing
      // start -> content -> end. Don't support them.
      console.log('`ReasoningMessageChunk` events are not supported');
      break;
    case agui.EventType.REASONING_END:
      // evtReasoningEnd(evt, draft);
      break;
    case agui.EventType.REASONING_ENCRYPTED_VALUE:
      // Ignored until needed
      break;
    default:
      console.error('unhandled ag-ui event', evt);
    }
  }

  /**
   * Handle the ag-ui `TextMessageStart` event.
   */
  function evtTextMessageStart(evt: agui.TextMessageStartEvent, draft: Draft): void {
    // Ignore non-assistant messages for now.
    if (evt.role !== 'assistant') {
      console.log(`Ignoring 'TextMessageStart' event with role: ${evt.role}`);
      return;
    }

    // Create a new empty assistant message.
    draft.push({ role: 'assistant', id: evt.messageId });
  }

  /**
   * Handle the ag-ui `TextMessageContent` event.
   */
  function evtTextMessageContent(evt: agui.TextMessageContentEvent, draft: Draft): void {
    // Find the message with specified id.
    const msg = draft.findLast(m => m.id === evt.messageId);

    // Log an error the message is not found.
    if (!msg) {
      console.error(`Message with id ${evt.messageId} not found.`);
      return;
    }

    // Add the content delta to the message.
    msg.content = (msg.content ?? '') + evt.delta;
  }

  // /**
  //  * Handle the ag-ui `ToolCallStart` event.
  //  */
  // function evtToolCallStart(evt: agui.ToolCallStartEvent, draft: Draft): void {
  //   // Find the best message to associate with the tool call.
  //   const msg = (
  //     evt.parentMessageId !== undefined ?
  //     draft.messages.findLast(m => m.id === evt.parentMessageId) :
  //     draft.messages.findLast(m => m.role === 'assistant')
  //   );

  //   // Log an error if a suitable message is not found.
  //   if (!msg) {
  //     console.error('Could not find parent message for tool call');
  //     return;
  //   }

  //   // Log an error if the message has the wrong role.
  //   if (msg.role !== 'assistant') {
  //     console.error(`Tool call parent message has invalid role: ${msg.role}`);
  //     return;
  //   }

  //   // Create the new tool call.
  //   const toolCall = {
  //     type: 'function',
  //     id: evt.toolCallId,
  //     function: { name: evt.toolCallName, arguments: '' }
  //   } as const;

  //   // Add the new tool call to the parent message.
  //   msg.toolCalls = [...(msg.toolCalls ?? []), toolCall];
  // }

  // /**
  //  * Handle the ag-ui `ToolCallArgs` event.
  //  */
  // function evtToolCallArgs(evt: agui.ToolCallArgsEvent, draft: Draft): void {
  //   // Find the tool call with the matching id.
  //   const toolCall = findToolCall(evt.toolCallId, draft);

  //   // Log an error if the tool call was not found.
  //   if (!toolCall) {
  //     console.error(`Tool call with id ${evt.toolCallId} not found.`);
  //     return;
  //   }

  //   // Update the tool call args with the delta.
  //   toolCall.function.arguments += evt.delta;
  // }

  // /**
  //  * Handle the ag-ui `ToolCallResult` event.
  //  */
  // function evtToolCallResult(evt: agui.ToolCallResultEvent, draft: Draft): void {
  //   // Add the tool result to the messages.
  //   draft.messages.push({
  //     role: 'tool',
  //     id: evt.messageId,
  //     toolCallId: evt.toolCallId,
  //     content: evt.content
  //   });
  // }

  /**
   * Handle the ag-ui `MessagesSnapshot` event.
   */
  function evtMessagesSnapshot(evt: agui.MessagesSnapshotEvent, draft: Draft): void {
    // Replace the entire messages history with the snapshot.
    draft.splice(0, draft.length, ...evt.messages);
  }

  // /**
  //  * Handle the ag-ui `ActivitySnapshot` event.
  //  */
  // function evtActivitySnapshot(evt: agui.ActivitySnapshotEvent, draft: Draft): void {
  //   // Find the message with the matching id.
  //   const msg = draft.messages.findLast(msg => msg.id === evt.messageId);

  //   // Log an error if the message exists and has an invalid type.
  //   if (msg && msg.role !== 'activity') {
  //     console.error(`'ActivitySnapshot' message has invalid role: ${msg.role}`);
  //     return;
  //   }

  //   // If the activity message exists, update its type and content.
  //   if (msg) {
  //     msg.activityType = evt.activityType;
  //     msg.content = evt.content;
  //     return;
  //   }

  //   // Add the new activity message to the messages history.
  //   draft.messages.push({
  //     role: 'activity',
  //     id: evt.messageId,
  //     activityType: evt.activityType,
  //     content: evt.content
  //   });
  // }

  // /**
  //  * Handle the ag-ui `ActivityDelta` event.
  //  */
  // function evtActivityDelta(evt: agui.ActivityDeltaEvent, draft: Draft): void {
  //   // Find the message with the matching id.
  //   const msg = draft.messages.findLast(msg => msg.id === evt.messageId);

  //   // Log an error the message is not found.
  //   if (!msg) {
  //     console.error(`Message with id ${evt.messageId} not found.`);
  //     return;
  //   }

  //   // Log an error if the message has an invalid type.
  //   if (msg.role !== 'activity') {
  //     console.error(`'ActivityDelta' message has invalid role: ${msg.role}`);
  //     return;
  //   }

  //   // Log an error if the activity type has changed.
  //   if (msg.activityType !== evt.activityType) {
  //     console.error(`'ActivityDelta' changed activity type: ${msg.activityType} -> ${evt.activityType}`);
  //     return;
  //   }

  //   // Update the activity message content with the JSON patch.
  //   msg.content = applyPatch(msg.content, evt.patch, false, false).newDocument;
  // }

  // /**
  //  * Handle the ag-ui `ReasoningStart` event.
  //  */
  // function evtReasoningStart(evt: agui.ReasoningStartEvent, draft: Draft): void {

  // }

  // /**
  //  * Handle the ag-ui `ReasoningMessageStart` event.
  //  */
  // function evtReasoningMessageStart(evt: agui.ReasoningMessageStartEvent, draft: Draft): void {

  // }

  // /**
  //  * Handle the ag-ui `ReasoningMessageContent` event.
  //  */
  // function evtReasoningMessageContent(evt: agui.ReasoningMessageContentEvent, draft: Draft): void {

  // }

  // /**
  //  * Handle the ag-ui `ReasoningMessageEnd` event.
  //  */
  // function evtReasoningMessageEnd(evt: agui.ReasoningMessageEndEvent, draft: Draft): void {

  // }

  // /**
  //  * Handle the ag-ui `ReasoningEnd` event.
  //  */
  // function evtReasoningEnd(evt: agui.ReasoningEndEvent, draft: Draft): void {

  // }

  // /**
  //  *
  //  */
  // function findToolCall(toolCallId: string, draft: Draft) {
  //   for (let i = draft.messages.length - 1; i >= 0; i--) {
  //     const msg = draft.messages[i];
  //     if (msg.role === 'assistant' && msg.toolCalls) {
  //       for (let j = msg.toolCalls.length - 1; j >= 0; j--) {
  //         const tc = msg.toolCalls[j];
  //         if (tc.id === toolCallId) {
  //           return tc;
  //         }
  //       }
  //     }
  //   }
  //   return null;
  // }
// }
