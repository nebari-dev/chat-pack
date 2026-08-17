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

/**
 * Describe the progress of the activity currently being built, if any.
 *
 * Activities (charts, maps) stream in while a run is in flight and can take a
 * while for large payloads. When the most recent message is such an activity,
 * this returns a human-readable progress label (e.g. the number of map points
 * plotted so far) so the wait reads as concrete progress rather than a freeze.
 *
 * Only the last message is considered, so a finished activity the agent has
 * already moved past does not produce a stale label.
 *
 * @param messages - The current thread messages.
 *
 * @returns A progress label, or `undefined` when no activity is building.
 */
export function activityProgressLabel(
  messages: api.ThreadMessages | null | undefined,
): string | undefined {
  const last = messages?.at(-1);
  if (last?.role !== 'activity') {
    return undefined;
  }

  switch (last.activityType) {
    case 'application/json+leaflet': {
      // Leaflet content holds a GeoJSON feature collection. Report how many
      // features have streamed in so far.
      const count = geoJsonFeatureCount(last.content?.features);
      return count > 0
        ? `Plotting ${count.toLocaleString()} map ${count === 1 ? 'point' : 'points'}…`
        : 'Building map…';
    }
    case 'application/json+echart':
      return 'Building chart…';
    default:
      return undefined;
  }
}

/**
 * Count the features in a value that may be a GeoJSON feature collection.
 *
 * Returns `0` for anything that is not a feature collection with a features
 * array, so a partially-streamed or malformed payload never throws.
 */
function geoJsonFeatureCount(features: unknown): number {
  if (
    features &&
    typeof features === 'object' &&
    'features' in features &&
    Array.isArray((features as { features: unknown }).features)
  ) {
    return (features as { features: readonly unknown[] }).features.length;
  }
  return 0;
}
