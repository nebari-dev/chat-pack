/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { toast } from 'sonner';

import { classifyError } from './errors';

/**
 * The default duration, in milliseconds, before a toast auto-dismisses.
 */
export const DEFAULT_TOAST_DURATION = 6000;

/**
 * Surface an error to the user as a toast notification.
 *
 * The error is classified into a category to derive safe, human-readable
 * copy. Persistent categories (e.g. auth, lost connection) do not
 * auto-dismiss and require explicit user action.
 *
 * Notifications are de-duplicated by category, so a burst of identical
 * errors collapses into a single toast rather than stacking.
 *
 * @param error - The thrown value to surface.
 *
 * @param options - Optional overrides for the notification behavior.
 */
export function notifyError(
  error: unknown,
  options: notifyError.Options = {},
): void {
  // Classify the error into safe, user-facing copy.
  const { category, message, detail, persistent } = classifyError(error);

  // Log the underlying error for debugging. The user only ever sees the
  // classified copy, never the raw message or stack trace.
  console.error(message, error);

  // Show the toast, de-duplicating by category via a stable id.
  toast.error(message, {
    id: `error:${category}`,
    description: detail,
    duration: persistent
      ? Number.POSITIVE_INFINITY
      : (options.duration ?? DEFAULT_TOAST_DURATION),
  });
}

/**
 * The namespace for the `notifyError` statics.
 */
export namespace notifyError {
  /**
   * A type alias for the `notifyError` options.
   */
  export type Options = {
    /**
     * The auto-dismiss duration, in milliseconds.
     *
     * Ignored for persistent errors, which never auto-dismiss. Defaults to
     * {@link DEFAULT_TOAST_DURATION} when omitted.
     */
    readonly duration?: number;
  };
}
