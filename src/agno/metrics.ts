/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';

import * as api from '@/api';

import {
  getAuthToken
} from '@/auth';


/**
 * Fetch the aggregate application metrics.
 *
 * @params options - The options to specify the time range for the query.
 *
 * @returns The aggregate metrics results for the requested time range.
 */
export
async function getMetrics(options: api.GetMetrics.Options): Promise<readonly api.Metrics[]> {
  // Extract the options.
  const { startDate, endDate } = options;

  // Create the search params for the request.
  const params = new URLSearchParams();
  params.append('starting_date', startDate);
  params.append('ending_date', endDate);

  // Ensure the metrics are up-to-date.
  //
  // TODO - if this POST becomes a performance problem, we may need to
  // implement a caching strategy, refresh on a timer, etc.
  await fetch('/agno/metrics/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Fetch the Agno OS config schema.
  const resp = await fetch(`/agno/metrics?${params}`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Guard against request failure.
  if (!resp.ok) {
    throw new Error(`Response: ${resp.status} ${resp.statusText}`);
  }

  // Convert the response to json.
  const json = await resp.json();

  // Parse the agno response.
  const parsed = v.parse(Private.metricsSchema, json);

  // Return the translated result.
  return parsed.metrics.map(row => ({
    date: row.updated_at,
    runsCount: row.agent_runs_count,
    sessionsCount: row.agent_sessions_count,
    tokenMetrics: Private.convertTokenMetrics(row.token_metrics),
    modelMetrics: row.model_metrics.map(Private.convertModelMetrics)
  }));
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  // A schema for Agno token metrics.
  const tokenMetricsSchema = v.object({
    input_tokens: v.number(),
    output_tokens: v.number(),
    total_tokens: v.number(),
  });

  // A schema for Agno model metrics.
  const modelMetricsSchema = v.object({
    model_id: v.string(),
    model_provider: v.string(),
    count: v.number(),
  });

  // A schema for an agno metrics row.
  const metricsRowSchema = v.object({
    agent_runs_count: v.number(),
    agent_sessions_count: v.number(),
    token_metrics: tokenMetricsSchema,
    model_metrics: v.array(modelMetricsSchema),
    updated_at: v.string(),
  });

  // A schmea for an agno metrics result.
  export
  const metricsSchema = v.object({
    metrics: v.array(metricsRowSchema)
  });

  /**
   * A function which converts Agno token metrics to api token metrics.
   */
  export
  function convertTokenMetrics(
    metrics: v.InferOutput<typeof tokenMetricsSchema>
  ): api.TokenMetrics {
    return {
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      totalTokens: metrics.total_tokens
    };
  }

  /**
   * A function which converts Agno model metrics to api model metrics.
   */
  export
  function convertModelMetrics(
    metrics: v.InferOutput<typeof modelMetricsSchema>
  ): api.ModelMetrics {
    return {
      modelId: metrics.model_id,
      modelProvider: metrics.model_provider,
      runCount: metrics.count
    };
  }
}
