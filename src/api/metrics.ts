/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as z from 'zod';

import * as auth from '@/auth';


/**
 * The schema for token metrics.
 */
export
const TokenMetricsSchema = z.object({
  /**
   * The tokens consumed for the model response.
   */
  completionTokens: z.number(),

  /**
   * The tokens consumed for the user prompt.
   */
  promptTokens: z.number(),

  /**
   * The number of tokens read from the cache.
   */
  cachedTokens: z.number(),

  /**
   * The number of tokens written to the cache.
   */
  cacheWriteTokens: z.number(),

  /**
   * The tokens consumed by reasoning/thinking.
   */
  reasoningTokens: z.number(),

  /**
   * The aggregate total of all tokens.
   */
  totalTokens: z.number()
});


/**
 * A type alias for token metrics.
 */
export
type TokenMetrics = z.infer<typeof TokenMetricsSchema>;


/**
 * The schema for model metrics.
 */
export
const ModelMetricsSchema = z.object({
  /**
   * The unique id of the model.
   */
  modelId: z.string(),

  /**
   * The name of the endpoint provider that hosted the model.
   */
  modelProvider: z.string(),

  /**
   * The total number of runs for the model.
   */
  runCount: z.number()
});


/**
 * A type alias for model metrics.
 */
export
type ModelMetrics = z.infer<typeof ModelMetricsSchema>;


/**
 * The schema for daily metrics.
 */
export
const DailyMetricsSchema = z.object({
  /**
   * The ISO UTC date string of the metrics.
   */
  date: z.string().date(),

  /**
   * The total number of runs across all threads for the day.
   */
  runsCount: z.number(),

  /**
   * The total number of threads for the day.
   */
  threadsCount: z.number(),

  /**
   * The aggregate token metrics across all threads for the day.
   */
  tokenMetrics: TokenMetricsSchema,

  /**
   * The aggregate model metrics across all threads for the day.
   */
  modelMetrics: z.array(ModelMetricsSchema)
});


/**
 * A type alias for daily metrics.
 */
export
type DailyMetrics = z.infer<typeof DailyMetricsSchema>;


/**
 * The schema for an array of daily metrics.
 */
export
const DailyMetricsArray = z.array(DailyMetricsSchema);


/**
 * A type alias for an array of daily metrics.
 */
export
type DailyMetricsArray = z.infer<typeof DailyMetricsArray>;


/**
 * Fetch the daily metrics over a time range.
 *
 * @params options - The options to specify the time range for the query.
 *
 * @returns The daily metrics results for the requested time range.
 */
export
async function getMetrics(options: getMetrics.Options): Promise<DailyMetricsArray> {
  // Extract the options.
  const { startDate, endDate } = options;

  // Create the search params for the request.
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);

  // Fetch the Agno OS config schema.
  const resp = await fetch(`/api/metrics?${params}`, {
    headers: { 'Authorization': `Bearer ${auth.getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Return the parsed result.
  return DailyMetricsArray.parse(await resp.json());
}


/**
 * The namespace for the `getMetrics` statics.
 */
export
namespace getMetrics {
  /**
   * A type alias for the `getMetrics` options.
   */
  export
  type Options = {
    /**
     * The start date for the aggregate metrics, inclusive.
     *
     * This is formatted as an ISO UTC string.
     */
    readonly startDate: string;

    /**
     * The end date for the aggregate metrics, inclusive.
     *
     * This is formatted as an ISO UTC string.
     */
    readonly endDate: string;
  };
}
