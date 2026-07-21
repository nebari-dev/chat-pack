/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as api from '@/api';

/**
 * Find the name of the tool call that is currently running, if any.
 *
 * A tool call is considered running when it has been started by the agent but
 * does not yet have a corresponding `tool` result message. The most recently
 * started unresolved tool call is returned so its name can be shown as
 * progress while it executes.
 *
 * @param messages - The current thread messages.
 *
 * @returns The running tool's name, or `undefined` when none is running.
 */
export function runningToolName(
  messages: api.ThreadMessages | null | undefined,
): string | undefined {
  if (!messages) {
    return undefined;
  }

  // Collect the ids of tool calls that already have a result.
  const resolved = new Set<string>();
  for (const msg of messages) {
    if (msg.role === 'tool') {
      resolved.add(msg.toolCallId);
    }
  }

  // Search from the end for the most recent unresolved tool call.
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant' || !msg.toolCalls) {
      continue;
    }
    for (let j = msg.toolCalls.length - 1; j >= 0; j--) {
      const tc = msg.toolCalls[j];
      if (!resolved.has(tc.id)) {
        return tc.function.name;
      }
    }
  }

  return undefined;
}
