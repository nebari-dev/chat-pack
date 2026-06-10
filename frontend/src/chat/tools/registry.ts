/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { getCurrentLocationTool } from './getcurrentlocation';
import { requestApprovalTool } from './requestapproval';

import type { FrontendTool } from './types';

/**
 * The registry of client-executed frontend tools.
 *
 * To add a new tool, implement a `FrontendTool` and append it here.
 */
export const FRONTEND_TOOLS: readonly FrontendTool[] = [
  getCurrentLocationTool,
  requestApprovalTool,
];

/**
 * A lookup of frontend tools by their advertised name.
 */
const TOOLS_BY_NAME = new Map<string, FrontendTool>(
  FRONTEND_TOOLS.map((tool) => [tool.definition.name, tool]),
);

/**
 * Test whether a tool name refers to a registered frontend tool.
 *
 * @param name - The tool name of interest.
 *
 * @returns `true` if the name refers to a frontend tool, `false` otherwise.
 */
export function isFrontendTool(name: string): boolean {
  return TOOLS_BY_NAME.has(name);
}

/**
 * Execute a frontend tool call and return its serialized result.
 *
 * @param name - The name of the tool to execute.
 *
 * @param argsJson - The raw JSON string of the tool arguments.
 *
 * @returns The result serialized as a string, suitable for the `content` of
 *   a `tool` result message. Errors are captured and serialized rather than
 *   thrown, so a single failing tool never aborts the run.
 */
export async function runFrontendTool(
  name: string,
  argsJson: string,
): Promise<string> {
  // Look up the registered tool.
  const tool = TOOLS_BY_NAME.get(name);

  // It's an error if the tool is somehow not registered.
  if (!tool) {
    return JSON.stringify({ error: `Unknown frontend tool: ${name}` });
  }

  try {
    // Parse the arguments, tolerating an empty string for no-arg tools.
    const args = argsJson ? JSON.parse(argsJson) : {};

    // Execute the handler and serialize the result.
    const result = await tool.handler(args);
    return JSON.stringify(result);
  } catch (error) {
    // Capture any failure as a structured result for the agent.
    const message = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: message });
  }
}
