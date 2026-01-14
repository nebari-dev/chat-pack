/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  pb
} from './pb'

/**
 * User login function
 * 
 * @param options {username and password}
 * 
 */
export
async function login(options: login.Options) {

  // Extract the options
  const {email, password} = options;

  // Auth with password using Pocketbase
  const resp = await pb.collection('users').authWithPassword(email, password);

  // returns logged in user data (type RecordModel)
  return resp
}

/**
 * namespace for the login
 */
export namespace login {

  export
  type Options = {
    /**
     * username for login
     */
    readonly email: string;

    /**
     * password for login
     */
    readonly password: string
  }
}
