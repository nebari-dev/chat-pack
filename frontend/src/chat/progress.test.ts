/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import type * as api from '@/api';

import { runningToolName } from './progress';

/**
 * Build an assistant message with the given tool calls.
 */
function assistant(
  id: string,
  toolCalls: readonly { id: string; name: string }[],
): api.ThreadMessages[number] {
  return {
    role: 'assistant',
    id,
    content: '',
    toolCalls: toolCalls.map((tc) => ({
      type: 'function',
      id: tc.id,
      function: { name: tc.name, arguments: '' },
    })),
  };
}

/**
 * Build a tool result message for the given tool call id.
 */
function toolResult(
  id: string,
  toolCallId: string,
): api.ThreadMessages[number] {
  return { role: 'tool', id, toolCallId, content: 'ok' };
}

describe('runningToolName', () => {
  it('returns undefined for missing messages', () => {
    expect(runningToolName(undefined)).toBeUndefined();
    expect(runningToolName(null)).toBeUndefined();
    expect(runningToolName([])).toBeUndefined();
  });

  it('returns undefined when there are no tool calls', () => {
    const messages: api.ThreadMessages = [
      { role: 'user', id: 'u1', content: 'hi' },
      { role: 'assistant', id: 'a1', content: 'hello' },
    ];
    expect(runningToolName(messages)).toBeUndefined();
  });

  it('returns the name of an unresolved tool call', () => {
    const messages: api.ThreadMessages = [
      assistant('a1', [{ id: 'tc1', name: 'search' }]),
    ];
    expect(runningToolName(messages)).toBe('search');
  });

  it('returns undefined once every tool call has a result', () => {
    const messages: api.ThreadMessages = [
      assistant('a1', [{ id: 'tc1', name: 'search' }]),
      toolResult('t1', 'tc1'),
    ];
    expect(runningToolName(messages)).toBeUndefined();
  });

  it('returns the most recently started unresolved tool call', () => {
    const messages: api.ThreadMessages = [
      assistant('a1', [{ id: 'tc1', name: 'search' }]),
      toolResult('t1', 'tc1'),
      assistant('a2', [{ id: 'tc2', name: 'extract' }]),
    ];
    expect(runningToolName(messages)).toBe('extract');
  });

  it('prefers the last unresolved call within a single message', () => {
    const messages: api.ThreadMessages = [
      assistant('a1', [
        { id: 'tc1', name: 'first' },
        { id: 'tc2', name: 'second' },
      ]),
    ];
    expect(runningToolName(messages)).toBe('second');
  });
});
