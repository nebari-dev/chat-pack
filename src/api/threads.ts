/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import * as z from 'zod';

import * as auth from '@/auth';

import type {
  PaginationOptions
} from '@/lib/pagination';

import {
  createPageSchema
} from '@/lib/pagination';

import {
  SSEParserStream
} from '@/lib/sse';


/**
 * The schema for a thread.
 */
export
const ThreadSchema = z.object({
  /**
   * The unique id of the thread.
   */
  id: z.string(),

  /**
   * The human readable name of the thread.
   */
  name: z.string().optional(),

  /**
   * The unique id of the agent for the thread.
   */
  agentId: z.string(),

  /**
   * The ISO UTC timestamp when the thread was created.
   */
  createdAt: z.string().datetime(),

  /**
   * The ISO UTC timestamp of the most recent update.
   */
  updatedAt: z.string().datetime().optional(),
});


/**
 * A type alias for a thread.
 */
export
type Thread = z.infer<typeof ThreadSchema>;


/**
 * The schema for a thread page.
 */
export
const ThreadPageSchema = createPageSchema(ThreadSchema);


/**
 * A type alias for a thread page.
 */
export
type ThreadPage = z.infer<typeof ThreadPageSchema>;


/**
 * The schema for thread messages.
 */
export
const ThreadMessagesSchema = z.array(agui.MessageSchema);


/**
 * A type alias for detailed information about a thread.
 */
export
type ThreadMessages = z.infer<typeof ThreadMessagesSchema>;


/**
 * Fetch a single `Thread` object.
 *
 * @params threadId - The unique id of the thread.
 *
 * @returns The requested thread object.
 */
export
async function getThread(threadId: string): Promise<Thread> {
  // Fetch the resource.
  const resp = await auth.fetch(`/api/threads/${threadId}`);

  // Return the parsed result.
  return ThreadSchema.parse(await resp.json());
}


/**
 * Get the messages for a particular thread.
 *
 * @params threadId - The unique id of the thread.
 *
 * @returns The messages for the thread.
 */
export
async function getThreadMessages(threadId: string): Promise<ThreadMessages> {
  // Fetch the resource.
  const resp = await auth.fetch(`/api/threads/${threadId}/messages`);

  // Return the parsed result.
  return ThreadMessagesSchema.parse(await resp.json());
}


/**
 * Fetch a page of `Thread` objects.
 *
 * @params options - The pagination options for the query.
 *
 * @returns A thread page subject to the query.
 */
export
async function getThreadPage(options: getThreadPage.Options): Promise<ThreadPage> {
  // Create the search params.
  const params = new URLSearchParams();

  // Convert the options to search params.
  if (options.pageSize !== undefined) {
    params.append('pageSize', `${options.pageSize}`);
  }
  if (options.pageNumber !== undefined) {
    params.append('pageNumber', `${options.pageNumber}`);
  }
  if (options.sortBy !== undefined) {
    params.append('sortBy', options.sortBy);
  }
  if (options.sortOrder !== undefined) {
    params.append('sortOrder', options.sortOrder);
  }

  // Fetch the resource.
  const resp = await auth.fetch(`/api/threads?${params}`);

  // Return the parsed result.
  return ThreadPageSchema.parse(await resp.json());
}


/**
 * The namespace for the `getThreadPage` statics.
 */
export
namespace getThreadPage {
  /**
   * A type alias for the `getThreadPage()` options.
   */
  export
  type Options = PaginationOptions<Thread>;
}


/**
 * A create a new empty thread prior to running user input.
 *
 * @param options - The options for creating the thread.
 *
 * @returns The new `Thread` object.
 */
export
async function createThread(options: createThread.Options): Promise<Thread> {
  // Fetch the resource.
  const resp = await auth.fetch('/api/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  // Return the parsed result.
  return ThreadSchema.parse(await resp.json());
}


/**
 * The namespace for the `createThread` statics.
 */
export
namespace createThread {
  /**
   * A type alias for the options to `createThread()`.
   */
  export
  type Options = {
    /**
     * The unique id of the agent for running the thread.
     */
    readonly agentId: string;

    /**
     * The human readable name of the thread.
     */
    readonly name?: string;
  };
}


/**
 * Delete threads on the server.
 *
 * @param threadIds - The ids of the threads to delete.
 */
export
async function deleteThreads(threadIds: readonly string[]): Promise<void> {
  await auth.fetch('/api/threads', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: threadIds })
  });
}


/**
 * Create a new run in a thread and stream the resulting events.
 *
 * @param options - The options for the run.
 *
 * @returns An async generator that streams the ag-ui events.
 */
export
async function *createRun(options: createRun.Options): AsyncGenerator<agui.AGUIEvent> {
  // Extract the options.
  const { threadId, ...rest } = options;

  // Fetch the resource.
  const resp = await fetch(`/api/threads/${threadId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest)
  });

  // Setup the SSE stream parser.
  const stream = resp.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SSEParserStream());

  // Yield the parsed events.
  for await (const evt of stream) {
    // Parse the event data to json.
    const json = JSON.parse(evt.data);

    // Yield the parsed/validated event.
    yield agui.EventSchemas.parse(json);
  }
}


/**
 * The namespace for the `createRun` statics.
 */
export
namespace createRun {
  /**
   * A type alias for the options to `createRun()`.
   */
  export
  type Options = Omit<agui.RunAgentInput, 'runId' | 'parentRunId' | 'state'>;
}
