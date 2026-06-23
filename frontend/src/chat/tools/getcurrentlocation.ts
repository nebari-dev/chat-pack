/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { JSONValue } from '@/lib/json';

import type { FrontendTool } from './types';

/**
 * A frontend tool that reads the user's current geographic location.
 *
 * #### Notes
 * This demonstrates a tool that returns data only the client can provide.
 * The browser prompts the user for permission; if the user denies it (or
 * the API is unavailable), the tool returns a structured error so the agent
 * can react gracefully instead of the run failing.
 */
export const getCurrentLocationTool: FrontendTool = {
  definition: {
    name: 'get_current_location',
    description:
      "Get the user's current geographic location (latitude and longitude) " +
      'from their browser. The user is prompted to grant permission and may ' +
      'decline, in which case an error is returned.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },

  handler: (): JSONValue | Promise<JSONValue> => {
    // Guard against environments without the geolocation API.
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { error: 'Geolocation is not available in this browser.' };
    }

    // Wrap the callback-based geolocation API in a promise.
    return new Promise<JSONValue>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        (error) => resolve({ error: error.message }),
        { enableHighAccuracy: false, timeout: 10000 },
      );
    });
  },
};
