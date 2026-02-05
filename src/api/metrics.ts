/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


/**
 * A type alias for token metrics.
 *
 * These can be specific to a run, or aggregated depending on the API
 * endpoint that was invoked. They can also be specific to a time range
 * if the API options allowed for a time range.
 *
 *
 * TODO - add more token fields.
 */
export
type TokenMetrics = {
  /**
   * The total input tokens for the specified time range.
   */
  readonly inputTokens: number;

  /**
   * The total output tokens for the specified time range.
   */
  readonly outputTokens: number;

  /**
   * The aggregate total of all tokens for the specified time range.
   *
   * This may be more than `inputTokens + outputTokens` if the provider
   * supports other tokens such as `audio`, `thinking`, etc.
   */
  readonly totalTokens: number;
};


/**
 * A type alias for model metrics.
 *
 * This type is used to track specific model runs over a time range.
 */
export
type ModelMetrics = {
  /**
   * The unique id of the model.
   */
  readonly modelId: string;

  /**
   * The name of the endpoint provider that hosted the model.
   */
  readonly modelProvider: string;

  /**
   * The number of runs for this model within the specified time range.
   */
  readonly runCount: number;
};


/**
 * A type alias for the aggregate metrics by-day.
 */
export
type Metrics = {
  /**
   * The ISO UTC date string of the metrics.
   *
   * The app metrics should be aggregated by ISO UTC day.
   */
  readonly date: string;

  /**
   * The total number of runs across all sessions for the day.
   */
  readonly runsCount: number;

  /**
   * The total number of sessions for the day.
   */
  readonly sessionsCount: number;

  /**
   * The aggregate token metrics across all sessions for the day.
   */
  readonly tokenMetrics: TokenMetrics;

  /**
   * The aggregate model metrics across all sessions for the day.
   */
  readonly modelMetrics: readonly ModelMetrics[];
};


/**
 * Fetch the aggregate application metrics.
 *
 * @params options - The options to specify the time range for the query.
 *
 * @returns The aggregate metrics results for the requested time range.
 */
export
type GetMetrics = (options: GetMetrics.Options) => Promise<readonly Metrics[]>;


/**
 * The namespace for the `GetMetrics` statics.
 */
export
namespace GetMetrics {
  /**
   * A type alias for the `GetMetrics` options.
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
