/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { describe, expect, it } from 'vitest';

import type * as api from '@/api';

import { activityProgressLabel, runningToolName } from './progress';

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

/**
 * Build a leaflet activity message with the given number of point features.
 */
function leafletActivity(pointCount: number): api.ThreadMessages[number] {
  return {
    role: 'activity',
    id: 'act1',
    activityType: 'application/json+leaflet',
    content: {
      center: [0, 0],
      features: {
        type: 'FeatureCollection',
        features: Array.from({ length: pointCount }, (_, i) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [i, i] },
          properties: {},
        })),
      },
    },
  };
}

describe('activityProgressLabel', () => {
  it('returns undefined when there is no activity in progress', () => {
    expect(activityProgressLabel(undefined)).toBeUndefined();
    expect(activityProgressLabel([])).toBeUndefined();
    expect(
      activityProgressLabel([{ role: 'assistant', id: 'a1', content: 'hi' }]),
    ).toBeUndefined();
  });

  it('reports the plotted point count for a leaflet activity', () => {
    expect(activityProgressLabel([leafletActivity(3200)])).toBe(
      'Plotting 3,200 map points…',
    );
  });

  it('singularizes a single point', () => {
    expect(activityProgressLabel([leafletActivity(1)])).toBe(
      'Plotting 1 map point…',
    );
  });

  it('falls back to a generic label before any points arrive', () => {
    expect(activityProgressLabel([leafletActivity(0)])).toBe('Building map…');
  });

  it('reports a generic label for an echart activity', () => {
    const messages: api.ThreadMessages = [
      {
        role: 'activity',
        id: 'act1',
        activityType: 'application/json+echart',
        content: {},
      },
    ];
    expect(activityProgressLabel(messages)).toBe('Building chart…');
  });

  it('only considers the last message, ignoring a finished activity', () => {
    const messages: api.ThreadMessages = [
      leafletActivity(5000),
      { role: 'assistant', id: 'a1', content: 'Here is your map.' },
    ];
    expect(activityProgressLabel(messages)).toBeUndefined();
  });
});
