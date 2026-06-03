/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import * as z from 'zod';

import * as auth from '@/auth';


/**
 * The schema for the current user.
 */
export
const UserSchema = z.object({
  /**
   * The user ID.
   */
  id: z.string(),
  /**
   * The permissions granted to the user.
   */
  permissions: z.array(z.string()),
  /**
   * Additional user data.
   */
  data: z.record(z.any()),
});


/**
 * A type alias for the current user.
 */
export
type User = z.infer<typeof UserSchema>;


/**
 * Fetch the current user information including permissions.
 *
 * @returns The user object.
 */
export
async function getUser(): Promise<User> {
  // Fetch the resource.
  const resp = await auth.fetch('/api/user');

  // Return the parsed result.
  return UserSchema.parse(await resp.json());
}
