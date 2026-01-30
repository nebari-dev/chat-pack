/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/


/**
 * A type alias for token metrics.
 *
 * These can be specific to a run, or aggregated depending on the API
 * endpoint that was invoked. They can also be specific to a time range
 * if the API args allowed for a time range.
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
   * supports other tokens such as `audio`, `thinking`, etc...
   */
  readonly totalTokens: number;
};


/**
 * A type alias for a model run metrics.
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
 * A type alias for a quick prompt for a specific agent.
 *
 * This type is used to render the suggested prompts for an agent, before
 * user input has been submitted in the chat input for an agent/session.
 */
export
type QuickPrompt = {
  /**
   * The title of the quick prompt.
   *
   * This is used to render the title of the quick prompt card.
   */
  readonly title: string;

  /**
   * The short description of the quick prompt.
   *
   * This is used to render the description of the quick prompt card.
   */
  readonly description: string;

  /**
   * The actual user input for the quick prompt.
   *
   * This will be used as the agent prompt if the user clicks the card.
   */
  readonly prompt: string;
};


/**
 * A type alias for the details of an Agent in the application.
 *
 * This type is used to populate the agent dropdown selector, the chat
 * quick prompts, and other UI areas where the agent detail is needed.
 *
 * This type is part of the `AppConfig` type, which is made available to
 * the entire Chat++ application.
 */
export
type AgentDetail = {
  /**
   * The unique id of the agent.
   */
  readonly agentId: string;

  /**
   * The human readable name of the agent.
   */
  readonly agentName: string;

  /**
   * A short description of the agent and its role/behavior.
   */
  readonly description: string;

  /**
   * The quick prompts to show for the agent in a new empty chat.
   */
  readonly quickPrompts?: readonly QuickPrompt[];
};


/**
 * The global application config object.
 */
export
type AppConfig = {
  /**
   * The unique id of the application.
   */
  readonly appId: string;

  /**
   * The human readable name of the application.
   */
  readonly appName: string;

  /**
   * The agents available to the application.
   */
  readonly agents: readonly AgentDetail[];
};


/**
 * A type alias for the `AbstractAPI.getAppMetrics()` options.
 */
export
type GetAppMetricsOptions = {
  /**
   * The start date for the aggregate metrics, inclusive.
   *
   * This is fromatted as an ISO UTC string. Implementations should
   * ignore the time, and only consume the year/month/day.
   */
  readonly startDate: string;

  /**
   * The end date for the aggregate metrics, inclusive.
   *
   * This is fromatted as an ISO UTC string. Implementations should
   * ignore the time, and only consume the year/month/day.
   */
  readonly endDate: string;
};


/**
 * A type alias for the application aggregate token metrics by-day.
 */
export
type AppTokenMetricsRow = {
  /**
   * The ISO UTC date string of the row.
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
};


/**
 * A type alias for the `AbstractAPI.getAppMetrics()` result.
 */
export
type GetAppMetricsResult = {
  /**
   * The token metrics for the requested time range.
   */
  readonly tokenMetrics: readonly AppTokenMetricsRow[];

  /**
   * The model metrics for the requested time range.
   */
  readonly modelMetrics: ModelMetrics;
};


/**
 * A type alias for the `AbstractAPI.listSessions()` options.
 */
export
type ListSessionsOptions = {
  /**
   * The agent id for filter the session result.
   *
   * If this is not provided, all agents will be included in the result.
   */
  readonly agentId?: string;

  /**
   * The pagination spec for filtering the request result.
   *
   * If this is not provided, the server is free to choose its own.
   */
  readonly pagination?: {
    /**
     * The upper limit of the number of responses to return per page.
     */
    readonly limit?: number;

    /**
     * The page to return based on the specified limit.
     */
    readonly page?: number;

    /**
     * The sort order based on the session last updated timestamp.
     */
    readonly sort?: 'ascending' | 'descending';
  };
};


/**
 * A type alias for session info.
 *
 * This is used to render a row in the sessions table.
 */
export
type SessionInfo = {
  /**
   * The unique id for the session.
   */
  readonly sessionId: string;

  /**
   * The human readable name of the session.
   */
  readonly sessionName: string;

  /**
   * The ISO UTC timestamp of when the session was created.
   */
  readonly createdAt: string;

  /**
   * The ISO UTC timestamp of the most recent update to the session.
   */
  readonly updatedAt: string;
};


/**
 * A type alias for the `AbstractAPI.listSessions()` response.
 */
export
type ListSessionsResult = {
  /**
   * The limit of the number of responses per page.
   *
   * This is either echoed from the request, or defined by the server if
   * pagination info was provided in the request.
   */
  readonly limit: number;

  /**
   * The page number of the provided results.
   *
   * This must agree with the `limit`, `pageCount`, and `totalCount`.
   */
  readonly page: number;

  /**
   * The total number of pages available based on `limit` and `totalCount`.
   */
  readonly pageCount: number;

  /**
   * The total number of records available, independent of `limit`.
   */
  readonly totalCount: number;

  /**
   * The session summaries for the request.
   *
   * This must always be `<= limit`.
   */
  readonly sessions: readonly SessionInfo[];
};


/**
 * A type alias for the `AbstractAPI.getSession()` options.
 */
export
type GetSessionOptions = {
  /**
   * The unique id of the session.
   */
  readonly sessionId: string;
};


/**
 * A type alias for a chat summary message in a session.
 *
 * This type alias is a deliberate summary of the messages for a session
 * run. It omits tool calls, thinking, etc. It's just a summary intended
 * to be shown as a quick overview before the user re-opens the full chat
 * experience to append to the session.
 */
export
type ChatSummaryMessage = {
  /**
   * The role of the message.
   *
   * The `user` role is typically the user input text. Markdown is not
   * supported. It's just plain text.
   *
   * The `assistant` role is the concatenated output from the agent for
   * a single run. Markdown is supported, but tool calls are not. This
   * is just the pure text output from the LLM for a single run.
   */
  readonly role: 'user' | 'assistant';

  /**
   * The ISO UTC timestamp for when the run was created.
   */
  readonly createdAt: string;

  /**
   * The text content for the user or assistant message.
   */
  readonly content: string;
};


/**
 * A type alias for the session detail.
 */
export
type SessionDetail = SessionInfo & {
  /**
   * The unique id of the agent for the session.
   */
  readonly agentId: string;

  /**
   * The human readonly name for the agent.
   */
  readonly agentName: string;

  /**
   * The unique id of the model underlying the agent.
   */
  readonly modelId: string;

  /**
   * The human readable name of the model underlying the agent.
   */
  readonly modelName: string;

  /**
   * The name of the hardware provider hosting the underlying model.
   */
  readonly modelProvider: string;

  /**
   * The aggregate token metrics for the session.
   */
  readonly tokenMetrics: TokenMetrics;

  /**
   * The array of summary messages for the session.
   *
   * These message are used to provide a quickly-rendered overview of the
   * session to allow the user to decide whether they want open the full
   * chat for the session and continue chatting.
   */
  readonly chatSummary: readonly ChatSummaryMessage[];
};


/**
 * A type alias for the `AbstractAPI.getSessionRuns()` options.
 */
export
type GetSessionRunsOptions = {
  /**
   * The unique id for the session.
   */
  readonly sessionId: string;
};


/**
 * A type alias that represents a full single run in a session.
 *
 * This is used as the absolute source of truth for a session, which
 * includes all details to fully re-hydrate a session run from the
 * stored state.
 */
export
type SessionRun = SessionInfo & {
  /**
   * The unique id for the run.
   */
  readonly runId: string;

  /**
   * The unique id for the agent for the run.
   */
  readonly agentId: string;

  /**
   * The event stream for the run.
   */
  readonly events: readonly RunEvent[];

  /**
   * The user prompt for the run.
   *
   * This is echoed from the submission prompt.
   */
  readonly userPrompt: string;
};


/**
 * A type alias for the `AbstractAPI.getMemories()` options.
 */
export
type GetMemoriesOptions = {
  /**
   * The unique id of the agent for filtered results.
   *
   * If this is not provided, the server should return all agents.
   */
  readonly agentId?: string;

  /**
   * The pagination spec for filtering the request result.
   *
   * If this is not provided, the server is free to choose its own.
   */
  readonly pagination?: {
   /**
     * The upper limit of the number of responses to return per page.
     */
    readonly limit?: number;
    /**
     * The page to return based on the specified limit.
     */
    readonly page?: number;

    /**
     * The sort order based on the session last updated timestamp.
     */
    readonly sort?: 'ascending' | 'descending';
  };
};


/**
 * A type alias for a single agentic memory.
 *
 * This type is used to display a row in an agentic memory table.
 */
export
type AgenticMemory = {
  /**
   * The unique id of the agent that create the memory.
   */
  readonly agentId: string;

  /**
   * The content that the agent saved for the memory.
   */
  readonly content: string;

  /**
   * The unique id of the memory.
   *
   * This will be used for deleting memories in the table.
   */
  readonly memoryId: string;

  /**
   * The short-form topics for which the memory is relevant.
   *
   * These will be rendered as pills/tokens in the table UI.
   */
  readonly topics: readonly string[];

  /**
   * The ISO UTC timestamp when the memory was last updated.
   */
  readonly updatedAt: string;
};


/**
 * A type alias for the `AbstractAPI.getMemories()` result.
 */
export
type GetMemoriesResult = {
  /**
   * The limit of the number of responses per page.
   *
   * This is either echoed from the request, or defined by the server if
   * pagination info was provided in the request.
   */
  readonly limit: number;

  /**
   * The page number of the provided results.
   *
   * This must agree with the `limit`, `pageCount`, and `totalCount`.
   */
  readonly page: number;

  /**
   * The total number of pages available based on `limit` and `totalCount`.
   */
  readonly pageCount: number;

  /**
   * The total number of records available, independent of `limit`.
   */
  readonly totalCount: number;

  /**
   * The memories for the request.
   *
   * This must always be `<= limit`.
   */
  readonly memories: readonly AgenticMemory[];
};


/**
 * A type alias for an event in a session run.
 */
export
type RunEvent = { // TODO define the events API

};


/**
 * A type alias for the `AbstractApi.createRun(...)` options.
 */
export
type CreateRunOptions = {
  /**
   * The new session id for the run.
   *
   * This must be a random UUIDv4.
   *
   * This will be assigned by the client on a new submission.
   */
  readonly sessionId: string;

  /**
   * The unique id of the agent to handle the run.
   */
  readonly agentId: string;

  /**
   * The user prompt for the run.
   */
  readonly userPrompt: string;
};


/**
 * A type alias for the `AbstractApi.continueRun(...)` options.
 */
export
type ContinueRunOptions = {
  /**
   * The unique session id to continue.
   */
  readonly sessionId: string;

  /**
   * The unique id of the run to continue.
   */
  readonly runId: string;

  /**
   * The user-supplied feedback for the agent.
   *
   * TODO - make this more well-typed.
   */
  readonly feedback: any;
};


/**
 * An interface that defines the API for Chat++.
 *
 * An impelementation of the interface is explicity **not** responsible for
 * caching. The Chat++ application handles caching. Implementations should
 * simply call to their actual backend APIs and translate results as needed.
 */
export
interface CppAPI {
  /**
   * Fetch the overall application config object.
   *
   * This defines the top-level application configuration which, among other
   * things, defines which agents are available to the application.
   *
   * @returns The global application configuration object.
   */
  getAppConfig(): Promise<AppConfig>;

  /**
   * Fetch the aggregate application metrics.
   *
   * @params options - The options to specify the time range for the query.
   *
   * @returns The aggregate metrics results for the requested time range.
   */
  getAppMetrics(options: GetAppMetricsOptions): Promise<GetAppMetricsResult>;

  /**
   * Fetch the sesssion summaries subject to the options.
   *
   * @params options - The options for creating the request.
   *
   * @returns The paginated session summaries according to the results.
   */
  listSessions(options: ListSessionsOptions): Promise<ListSessionsResult>;

  /**
   * Fetch the details for a particular session.
   *
   * @params options - The options that identifies the session of interest.
   *
   * @returns The details of the specified session, minus its runs. This
   *   result is useful for generating a medium-overview of the session.
   */
  getSession(options: GetSessionOptions): Promise<SessionDetail>;

  /**
   * Fetch the runs for a particular session.
   *
   * @params options - The options that identifies the session of interest.
   *
   * @returns A full and complete history of the session runs. This can be
   *   used to restore the full state of a session from history.
   */
  getSessionRuns(options: GetSessionRunsOptions): Promise<readonly SessionRun[]>;

  /**
   * Fetch the agentic memories subject to the options.
   *
   * @params options - The options for creating the request.
   *
   * @returns The agentic memories that have been stored for the user/agent.
   */
  getMemories(options: GetMemoriesOptions): Promise<GetMemoriesResult>;

  /**
   * Create a new session run according the options.
   *
   * @param options - The options for creating the run.
   *
   * @returns An async generator that streams run events.
   */
  createRun(options: CreateRunOptions): AsyncGenerator<RunEvent>;

  /**
   * Continue a session run after a human-in-the-loop pause.
   *
   * @param options - The options for continuing the run.
   *
   * @returns An async generator that continues the run events.
   */
  continueRunOptions(options: ContinueRunOptions): AsyncGenerator<RunEvent>;
}
