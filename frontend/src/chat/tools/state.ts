/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { useSyncExternalStore } from 'react';

import { FRONTEND_TOOLS } from './registry';

import type { FrontendTool } from './types';

/**
 * The set of disabled frontend tool names.
 *
 * A tool is enabled unless its name appears in this set, so a freshly
 * registered tool defaults to enabled unless it declares
 * `defaultEnabled: false`. The reference is replaced (never mutated) on every
 * change so it can serve as a stable `useSyncExternalStore` snapshot. This
 * state is in-memory only and resets on reload.
 */
let disabled: ReadonlySet<string> = new Set(
  FRONTEND_TOOLS.filter((tool) => tool.defaultEnabled === false).map(
    (tool) => tool.definition.name,
  ),
);

/**
 * The set of subscribers notified whenever the disabled set changes.
 */
const listeners = new Set<() => void>();

/**
 * Notify all subscribers that the disabled set has changed.
 */
function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Subscribe to changes in the frontend tool enablement state.
 *
 * @param listener - The callback invoked on every change.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToolStates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get the current set of disabled tool names.
 *
 * The returned reference is stable until the next change, making it suitable
 * as a `useSyncExternalStore` snapshot.
 *
 * @returns The disabled tool names.
 */
export function getDisabledToolNames(): ReadonlySet<string> {
  return disabled;
}

/**
 * Test whether a frontend tool is currently enabled.
 *
 * @param name - The advertised name of the tool.
 *
 * @returns `true` if the tool is enabled, `false` otherwise.
 */
export function isToolEnabled(name: string): boolean {
  return !disabled.has(name);
}

/**
 * Enable or disable a frontend tool, persisting and broadcasting the change.
 *
 * @param name - The advertised name of the tool.
 *
 * @param enabled - `true` to enable the tool, `false` to disable it.
 */
export function setToolEnabled(name: string, enabled: boolean): void {
  // Bail if the tool is already in the requested state.
  if (enabled === isToolEnabled(name)) {
    return;
  }

  // Replace the set with an updated copy so the snapshot reference changes.
  const next = new Set(disabled);
  if (enabled) {
    next.delete(name);
  } else {
    next.add(name);
  }
  disabled = next;

  // Notify subscribers.
  emit();
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
  return FRONTEND_TOOLS.filter((tool) =>
    isToolEnabled(tool.definition.name),
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
  const disabledSet = useSyncExternalStore(
    subscribeToolStates,
    getDisabledToolNames,
    getDisabledToolNames,
  );
  return FRONTEND_TOOLS.map((tool) => ({
    tool,
    enabled: !disabledSet.has(tool.definition.name),
  }));
}
