/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useEffect, useState
} from 'react';

import {
  pb
} from '@/api/pb';


/**
 * A react hook that polls a URL every ms milliseconds.
 */
export
function usePoll<T>(ms: number, url: string): T | null {
  // Create the state to hold the polled value.
  const [value, setValue] = useState<T | null>(null);

  // Use an effect to setup the polling loop.
  useEffect(() => {
    // Create the poller function.
    const poller = async () => {
      // Fetch the resource.
      const resp = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pb.authStore.token}`
        },
      });

      // Guard against request failure.
      if (!resp.ok) {
        throw new Error(`Response: ${resp.status} ${resp.statusText}`);
      }

      // Convert the response to JSON.
      const json = await resp.json();

      // Assume the JSON format is correct.
      setValue(json as T);
    };

    // Start the polling loop.
    const id = setInterval(poller, ms);

    // Return the cleanup function that stops the polling.
    return () => { clearInterval(id); };
  }, [url, ms]);

  // Return the current value of the poll.
  return value;
}
