/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { FetchError } from '@/auth';

/**
 * The category of a user-facing error.
 *
 * The category determines the copy shown to the user and whether the
 * resulting notification should auto-dismiss or persist until acknowledged.
 */
export enum ErrorCategory {
  /**
   * The request failed to reach the server (offline, DNS, CORS, etc).
   */
  Network = 'network',

  /**
   * The model or server took too long to respond.
   */
  Timeout = 'timeout',

  /**
   * The request was rejected due to an authentication failure (401).
   */
  Auth = 'auth',

  /**
   * The request was rejected due to rate limiting (429).
   */
  RateLimit = 'rate-limit',

  /**
   * The server encountered an internal error (>= 500).
   */
  Server = 'server',

  /**
   * An unexpected or unclassifiable error.
   */
  Unknown = 'unknown',
}

/**
 * An error thrown when a run fails on the backend.
 *
 * This is used to wrap ag-ui `RUN_ERROR` events so they can be classified
 * and surfaced through the same notification path as other errors.
 */
export class RunError extends Error {
  /**
   * Construct a new `RunError`.
   */
  constructor(message?: string) {
    super(message || 'Run error');
    this.name = 'RunError';
  }
}

/**
 * A type alias for an error that has been classified for display.
 */
export type ClassifiedError = {
  /**
   * The category of the error.
   */
  readonly category: ErrorCategory;

  /**
   * The short, human-readable message to show to the user.
   */
  readonly message: string;

  /**
   * An optional, safe technical detail (e.g. a status code).
   *
   * This never contains raw API error messages or stack traces.
   */
  readonly detail?: string;

  /**
   * Whether the error should persist until the user dismisses it.
   *
   * Persistent errors (e.g. auth failure, lost connection) require explicit
   * user action and do not auto-dismiss.
   */
  readonly persistent: boolean;
};

/**
 * The user-facing copy for each error category.
 *
 * Copy is kept to a single sentence and never exposes raw error details.
 */
const COPY: Record<ErrorCategory, string> = {
  [ErrorCategory.Network]: 'Connection lost. Check your network and try again.',
  [ErrorCategory.Timeout]:
    'The model took too long to respond. Please try again.',
  [ErrorCategory.Auth]:
    'Authentication error. Refresh the page or sign in again.',
  [ErrorCategory.RateLimit]:
    "You've hit the rate limit. Wait a moment before retrying.",
  [ErrorCategory.Server]: 'Something went wrong. Try again shortly.',
  [ErrorCategory.Unknown]: 'An unexpected error occurred.',
};

/**
 * The categories whose notifications should persist until dismissed.
 */
const PERSISTENT = new Set([ErrorCategory.Auth, ErrorCategory.Network]);

/**
 * Classify an arbitrary thrown value into a displayable error.
 *
 * @param error - The thrown value to classify.
 *
 * @returns The classified error with safe, user-facing copy.
 */
export function classifyError(error: unknown): ClassifiedError {
  const category = categorize(error);
  return {
    category,
    message: COPY[category],
    detail: detailFor(error, category),
    persistent: PERSISTENT.has(category),
  };
}

/**
 * Determine the category for a thrown value.
 */
function categorize(error: unknown): ErrorCategory {
  // Classify HTTP failures by their status code.
  if (error instanceof FetchError) {
    if (error.status === 401 || error.status === 403) {
      return ErrorCategory.Auth;
    }
    if (error.status === 429) {
      return ErrorCategory.RateLimit;
    }
    if (error.status === 408 || error.status === 504) {
      return ErrorCategory.Timeout;
    }
    if (error.status >= 500) {
      return ErrorCategory.Server;
    }
    return ErrorCategory.Unknown;
  }

  // Backend run failures are treated as server errors.
  if (error instanceof RunError) {
    return ErrorCategory.Server;
  }

  // A `TypeError` from `fetch` indicates a network-level failure.
  if (error instanceof TypeError) {
    return ErrorCategory.Network;
  }

  // The browser reports being offline.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return ErrorCategory.Network;
  }

  return ErrorCategory.Unknown;
}

/**
 * Produce a safe, optional technical detail for an error.
 *
 * This only ever exposes a status code, never a raw message or stack trace.
 */
function detailFor(
  error: unknown,
  category: ErrorCategory,
): string | undefined {
  if (error instanceof FetchError && category !== ErrorCategory.Network) {
    return `HTTP ${error.status}`;
  }
  return undefined;
}
