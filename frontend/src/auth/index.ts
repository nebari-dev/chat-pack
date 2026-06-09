/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import Keycloak from 'keycloak-js';

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

// The singleton `Keycloak` instance for handling authentication.
const keycloak = new Keycloak('/keycloak-config.json');

// If auth is enabled, init keycloak before anything else is loaded.
//
// This allows redirects to happen cleanly after a login and prevents
// redirect loops if it were to be performed lazily in `login()`.
if (AUTH_ENABLED) {
  await keycloak.init({ checkLoginIframe: false });
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
  if (AUTH_ENABLED) {
    await keycloak.updateToken();
  }

  // Create the extra headers if needed.
  const headers = (
    AUTH_ENABLED ? { Authorization: `Bearer ${keycloak.token ?? ''}` } : {}
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
 * A function which handles the user login via Keycloak.
 *
 * If the user is already logged-in this is a no-op.
 */
export async function login(): Promise<void> {
  // Bail early if login is not needed.
  if (!AUTH_ENABLED || keycloak.authenticated) {
    return;
  }

  // Authenticate the user.
  await keycloak.login({ redirectUri: window.location.origin });
}

/**
 * A function which handles user logout via Keycloack.
 *
 * If the user is already logged-out this is just a redirect to origin.
 */
export async function logout(): Promise<void> {
  // Redirect if auth is not enabled.
  //
  // On execution, `keycloak.authenticated` might be `false` if the user
  // is authed but the `keycloak.init()` promise has not yet resolved,
  // which would yield a false negative, so don't check for it.
  if (!AUTH_ENABLED) {
    window.location.replace(window.location.origin);
    return;
  }

  // Log out the user.
  await keycloak.logout({ redirectUri: window.location.origin });
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
  if (!AUTH_ENABLED || !keycloak.authenticated) {
    return null;
  }

  // Return the user profile from the parsed token data.
  return {
    name: keycloak.tokenParsed?.name ?? '',
    email: keycloak.tokenParsed?.email ?? '',
  };
}
