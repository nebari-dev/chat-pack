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
 * The schema for metadata about a thread.
 */
export
const ThreadMetadataSchema = z.object({
  /**
   * The unique id of the thread.
   */
  id: z.string(),

  /**
   * The human readable name of the thread.
   */
  name: z.string(),

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
  updatedAt: z.string().datetime()
});


/**
 * A type alias for metadata about a thread.
 */
export
type ThreadMetadata = z.infer<typeof ThreadMetadataSchema>;


/**
 * The schema for a thread metadata page.
 */
export
const ThreadMetadataPageSchema = createPageSchema(ThreadMetadataSchema);


/**
 * A type alias for a thread metadata page.
 */
export
type ThreadMetadataPage = z.infer<typeof ThreadMetadataPageSchema>;


/**
 * The schema for detailed information about a thread.
 */
export
const ThreadSchema = ThreadMetadataSchema.extend({
  /**
   * The ag-ui messages for the thread.
   */
  messages: z.array(agui.MessageSchema)
});


/**
 * A type alias for detailed information about a thread.
 */
export
type Thread = z.infer<typeof ThreadSchema>;


/**
 * Fetch a page of `ThreadMetadata` objects.
 *
 * @params options - The pagination options for the query.
 *
 * @returns A thread metadata page subject to the query.
 */
export
async function getThreadsMetadata(options: PaginationOptions<ThreadMetadata>): Promise<ThreadMetadataPage> {
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
  const resp = await fetch(`/api/threads/metadata?${params}`, {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return ThreadMetadataPageSchema.parse(await resp.json());
}


/**
 * Fetch the details of a single thread.
 *
 * @params threadId - The unique id of the thread.
 *
 * @returns The requested thread detail object.
 */
export
async function getThread(threadId: string): Promise<Thread> {
  // Fetch the resource.
  const resp = await fetch(`/api/threads/${threadId}`, {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return ThreadSchema.parse(await resp.json());
}


/**
 * A create a new empty thread prior to running user input.
 *
 * @param options - The options for creating the thread.
 *
 * @returns The new empty thread.
 */
export
async function createThread(options: createThread.Options): Promise<Thread> {
  // Fetch the resource.
  const resp = await fetch(`/api/threads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

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
    readonly name: string;
  };
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
    headers: {
      'Authorization': `Bearer ${auth.getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rest)
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

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
