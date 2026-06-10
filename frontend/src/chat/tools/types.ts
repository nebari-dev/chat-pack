/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import type { JSONValue } from '@/lib/json';

/**
 * The execution context passed to a frontend tool handler.
 *
 * #### Notes
 * This carries the ambient run information a handler may need to scope its
 * side effects — most importantly the thread the call belongs to, so a
 * handler that surfaces UI (e.g. an approval card) can tie it to its thread.
 */
export type FrontendToolContext = {
  /**
   * The id of the thread the tool call was made in.
   */
  readonly threadId: string;
};

/**
 * A client-executed ("frontend") tool that adheres to the ag-ui protocol.
 *
 * #### Notes
 * A frontend tool is advertised to the agent via the `tools` array of the
 * `RunAgentInput`. When the agent calls the tool, the backend emits the
 * tool call events and finishes the run *without* a result, since the tool
 * is executed externally (in the browser). The frontend runs the `handler`,
 * appends a `tool` result message, and submits a follow-up run so the agent
 * can continue with the result in hand.
 */
export type FrontendTool = {
  /**
   * The ag-ui tool definition advertised to the agent.
   *
   * The `parameters` field should be a JSON Schema describing the arguments
   * the agent is expected to provide.
   */
  readonly definition: agui.Tool;

  /**
   * Execute the tool in the browser.
   *
   * @param args - The parsed arguments provided by the agent.
   *
   * @param context - The ambient run context, including the thread id.
   *
   * @returns The JSON-serializable result returned to the agent. It is
   *   serialized into the `content` of the `tool` result message.
   */
  readonly handler: (
    args: Record<string, unknown>,
    context: FrontendToolContext,
  ) => JSONValue | Promise<JSONValue>;

  /**
   * Whether the tool is advertised to the agent by default.
   *
   * Defaults to `true`. Set to `false` for tools that should start disabled
   * and only be offered after the user opts in via the tools panel.
   */
  readonly defaultEnabled?: boolean;
};
