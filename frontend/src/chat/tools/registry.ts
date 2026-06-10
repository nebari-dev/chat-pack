/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { getDefaultStore, useAtomValue } from 'jotai';

import { disabledToolsAtom } from '@/store';

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

/**
 * The default Jotai store, used to read and write the atom outside React.
 */
const store = getDefaultStore();

// Seed the disabled set with the tools that opt out of being enabled by
// default. This runs once when the registry module is first evaluated.
store.set(
  disabledToolsAtom,
  new Set(
    FRONTEND_TOOLS.filter((tool) => tool.defaultEnabled === false).map(
      (tool) => tool.definition.name,
    ),
  ),
);

/**
 * Enable or disable a frontend tool, broadcasting the change to subscribers.
 *
 * @param name - The advertised name of the tool.
 *
 * @param enabled - `true` to enable the tool, `false` to disable it.
 */
export function setToolEnabled(name: string, enabled: boolean): void {
  const disabled = store.get(disabledToolsAtom);

  // Bail if the tool is already in the requested state.
  if (enabled === !disabled.has(name)) {
    return;
  }

  const next = new Set(disabled);
  if (enabled) {
    next.delete(name);
  } else {
    next.add(name);
  }
  store.set(disabledToolsAtom, next);
}

/**
 * Get the ag-ui tool definitions for the currently enabled frontend tools.
 *
 * This is what should be advertised to the agent in a run, so disabled tools
 * are never offered.
 *
 * @returns The list of enabled tool definitions for the `RunAgentInput`.
 */
export function enabledFrontendToolDefinitions(): agui.Tool[] {
  const disabled = store.get(disabledToolsAtom);
  return FRONTEND_TOOLS.filter(
    (tool) => !disabled.has(tool.definition.name),
  ).map((tool) => tool.definition);
}

/**
 * The enablement state of a single frontend tool.
 */
export type FrontendToolState = {
  /**
   * The frontend tool.
   */
  readonly tool: FrontendTool;

  /**
   * Whether the tool is currently enabled.
   */
  readonly enabled: boolean;
};

/**
 * A hook returning every registered frontend tool with its enabled state.
 *
 * The component re-renders whenever any tool is toggled.
 *
 * @returns The frontend tools paired with their current enablement.
 */
export function useFrontendToolStates(): FrontendToolState[] {
  const disabled = useAtomValue(disabledToolsAtom);
  return FRONTEND_TOOLS.map((tool) => ({
    tool,
    enabled: !disabled.has(tool.definition.name),
  }));
}
