/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  MessageSchema
} from '@ag-ui/core';

import * as z from 'zod';

import {
  TokenMetricsSchema
} from './metrics';

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
