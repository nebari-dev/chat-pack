/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  AuthRecord
} from 'pocketbase';

import PocketBase from 'pocketbase';


// A singleton pocketbase instance for managing auth.
const pb = new PocketBase(import.meta.env.VITE_PB_URL);


/**
 * A type alias for a user auth record.
 */
export type { AuthRecord }


/**
 * A function which handles the user login via UN/PW.
 *
 * @param options - The options for logging in the user.
 *
 */
export
async function login(options: login.Options): Promise<void> {
  // Extract the options
  const { username, password } = options;

  // Auth with password using Pocketbase
  await pb.collection('users').authWithPassword(username, password);
}


/**
 * The namespace for the `login` statics.
 */
export
namespace login {
  /**
   * A type alias for the `login` options.
   */
  export
  type Options = {
    /**
     * The username for the login.
     */
    readonly username: string;

    /**
     * The password for login.
     */
    readonly password: string
  };
}


/**
 * A function which handles user logout.
 */
export
function logout(): void {
  pb.authStore.clear();
}


/**
 * Get the auth record for the logged in user, or `null`.
 */
export
function getUser(): AuthRecord {
  return pb.authStore.record;
};


/**
 * Get the auth token for the logged in user.
 */
export
function getAuthToken(): string {
  return pb.authStore.token;
}


/**
 * Register a callback to be notified of user change.
 *
 * @param cb - A callback to invoke when the auth record changes.
 *
 * @returns A function that will unregister the callback.
 */
export
function onUserChange(cb: (token: string, record: AuthRecord) => void): () => void {
  return pb.authStore.onChange((token, record) => { cb(token, record); });
}
