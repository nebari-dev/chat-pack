/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createOidc } from 'oidc-spa/core';

// Save a reference to the native fetch before it can be overridden.
//
// This does two things:
//   1) It prevents a monkey-patched fetch from intercepting the
//      the auth token, unless it's patched before this module loads.
//   2) It allows us to define our own `fetch` without name-clashing.
const nativeFetch = window.fetch;

/**
 * An error thrown when a fetch request returns a non-ok response.
 *
 * This carries the HTTP status so callers can classify the failure
 * (e.g. auth, rate limit, server error) without parsing a message string.
 */
export class FetchError extends Error {
  /**
   * The HTTP status code of the failed response.
   */
  readonly status: number;

  /**
   * The HTTP status text of the failed response.
   */
  readonly statusText: string;

  /**
   * Construct a new `FetchError`.
   */
  constructor(status: number, statusText: string) {
    super(`Fetch failure: ${status} ${statusText}`);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Whether auth is enabled for the application.
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true';

// The singleton `oidc` instance for handling authentication.
let oidc: Awaited<ReturnType<typeof createOidc>> | null = null;

// If auth is enabled, init oidc before anything else is loaded.
//
// This allows redirects to happen cleanly after a login and prevents
// redirect loops if it were to be performed lazily in `login()`.
if (AUTH_ENABLED) {
  const configResp = await fetch('/auth-config.json');
  const config = await configResp.json();

  oidc = await createOidc({
    issuerUri: config.issuer,
    clientId: config.client_id,
    BASE_URL: window.location.origin,
  });
}

/**
 * A fetch wrapper that adds the bearer token to the request headers.
 *
 * This function provides several benefits:
 *   1) It prevents the exposure of any tokens
 *   2) It automatically handles refreshing the bearer token
 *   3) It handles the `!response.okay` condition
 */
export async function fetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  // Ensure we have an unexpired token.
  if (AUTH_ENABLED && oidc?.isUserLoggedIn) {
    await oidc.renewTokens();
  }

  // Create the extra headers if needed.
  const headers = (
    AUTH_ENABLED && oidc?.isUserLoggedIn
      ? { Authorization: `Bearer ${(await oidc.getTokens()).accessToken}` }
      : {}
  ) as HeadersInit;

  // Clone the init object and headers to prevent snooping by the caller.
  const options = { ...init, headers: { ...init.headers, ...headers } };

  // Fetch the resource.
  const resp = await nativeFetch(url, options);

  // Guard against request failure.
  if (!resp.ok) {
    throw new FetchError(resp.status, resp.statusText);
  }

  // Return the response.
  return resp;
}

/**
 * A function which handles the user login via OIDC.
 *
 * If the user is already logged-in this is a no-op.
 */
export async function login(): Promise<void> {
  // Bail early if login is not needed.
  if (!AUTH_ENABLED || !oidc || oidc.isUserLoggedIn) {
    return;
  }

  // Authenticate the user.
  await oidc.login({ redirectUrl: window.location.origin });
}

/**
 * A function which handles user logout via OIDC.
 *
 * If the user is already logged-out this is just a redirect to origin.
 */
export async function logout(): Promise<void> {
  // Redirect if auth is not enabled.
  if (!AUTH_ENABLED) {
    window.location.replace(window.location.origin);
    return;
  }

  // Log out the user.
  if (oidc?.isUserLoggedIn) {
    await oidc.logout({ redirectTo: 'home' });
  }
}

/**
 * A type alias for a user profile.
 */
export type UserProfile = {
  /**
   * The user name.
   */
  name: string;

  /**
   * The user email.
   */
  email: string;
};

/**
 * Get the profile for the logged in user, or `null`.
 */
export function getUserProfile(): UserProfile | null {
  // Bail early if auth is not enabled.
  if (!AUTH_ENABLED || !oidc || !oidc.isUserLoggedIn) {
    return null;
  }

  // Return the user profile from the decoded ID token.
  const decoded = oidc.getDecodedIdToken();
  // ponytail: oidc-spa returns a generic DecodedIdToken type that extends
  // the OIDC core spec with optional name/email claims. We know these are
  // present if the user is logged in (they're required by the OIDC spec
  // for the ID token), but the type doesn't reflect that. Cast to any
  // to avoid the TS error, since the runtime invariant is sound.
  return {
    name: (decoded as any).name ?? '',
    email: (decoded as any).email ?? '',
  };
}
