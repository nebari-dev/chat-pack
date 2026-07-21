/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import { Spinner } from '@/components/ui/spinner';

import { messages } from './spinnermessages.json';

/**
 * Pick a random humorous waiting message.
 */
function randomMessage(): string {
  const r = Math.random();
  const j = messages.length - 1;
  const i = Math.round(r * j);
  return messages[i];
}

/**
 * A react component that renders a waiting spinner with humorous messages.
 *
 * This is shown in the assistant message position while the model is
 * reasoning, from message submit until the first response output arrives.
 *
 * When a `label` is provided (e.g. the name of a running tool), it is shown
 * verbatim in place of the rotating humorous messages, so a slow step reads
 * as concrete progress rather than an idle wait.
 */
export function WaitingSpinner({ label }: WaitingSpinner.Props): ReactNode {
  // Create the state to hold the current random message.
  const [message, setMessage] = useState(randomMessage);

  // Rotate the message every 3s while the spinner is mounted.
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(randomMessage());
    }, 3000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Return the rendered component.
  return (
    <div
      role="status"
      aria-label={label ?? 'Model is thinking…'}
      className="flex flex-row items-center gap-3 text-muted-foreground"
    >
      <Spinner aria-hidden />
      <span className="text-sm">{label ?? message}</span>
    </div>
  );
}

/**
 * The namespace for the `WaitingSpinner` statics.
 */
export namespace WaitingSpinner {
  /**
   * A type alias for the `WaitingSpinner` props.
   */
  export type Props = {
    /**
     * An optional progress label to show in place of the rotating messages.
     */
    readonly label?: string;
  };
}
