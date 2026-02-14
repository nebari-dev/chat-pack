/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  MessageSchema
} from '@ag-ui/core';

import * as z from 'zod';

import * as auth from '@/auth';

import {
  TokenMetricsSchema
} from './metrics';

import type {
  PageOptions
} from './shared';

import {
  createPageSchema
} from './shared';


/**
 * The schema for high-level information about a thread.
 */
export
const ThreadInfoSchema = z.object({
  /**
   * The unique id of the thread.
   */
  threadId: z.string(),

  /**
   * The human readable name of the thread.
   */
  threadName: z.string(),

  /**
   * The id of the agent used in the thread.
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
 * A type alias for high-level information about a thread.
 */
export
type ThreadInfo = z.infer<typeof ThreadInfoSchema>;


/**
 * The schema for a thread info page.
 */
export
const ThreadInfoPageSchema = createPageSchema(ThreadInfoSchema);


/**
 * A type alias for a thread info page.
 */
export
type ThreadInfoPage = z.infer<typeof ThreadInfoPageSchema>;


/**
 * The schema for detailed information about a thread.
 */
export
const ThreadDetailSchema = ThreadInfoSchema.extend({
  /**
   * The aggregate metrics for the thread.
   */
  tokenMetrics: TokenMetricsSchema,

  /**
   * The AG-UI messages for the thread.
   */
  messages: z.array(MessageSchema)
});


/**
 * A type alias for detailed information about a thread.
 */
export
type ThreadDetail = z.infer<typeof ThreadDetailSchema>;


/**
 * Fetch a page of high-level `ThreadInfo` objects.
 *
 * @params options - The options to specify the query.
 *
 * @returns A thread info page subject to the query.
 */
export
async function getThreads(options: PageOptions<ThreadInfo>): Promise<ThreadInfoPage> {
  // Create the search params.
  const params = new URLSearchParams();

  // Convert the options to search params.
  if (options.limit !== undefined) {
    params.append('limit', `${options.limit}`);
  }
  if (options.page !== undefined) {
    params.append('page', `${options.page}`);
  }
  if (options.sortBy !== undefined) {
    params.append('sortBy', options.sortBy);
  }
  if (options.sortOrder !== undefined) {
    params.append('sortOrder', options.sortOrder);
  }

  // Fetch the resource.
  const resp = await fetch(`/api/threads?${params}`, {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return ThreadInfoPageSchema.parse(await resp.json());
}


/**
 * Fetch the details of a single thread.
 *
 * @params threadId - The unique id of the thread.
 *
 * @returns The requested thread detail object.
 */
export
async function getThreadDetail(threadId: string): Promise<ThreadDetail> {
  // Fetch the resource.
  const resp = await fetch(`/api/threads/${threadId}`, {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return ThreadDetailSchema.parse(await resp.json());
}
