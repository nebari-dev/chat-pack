/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createFileRoute, redirect, useNavigate
} from '@tanstack/react-router';

import * as z from 'zod';

import * as auth from '@/auth';

import {
  Login
} from '@/login';


/**
 * The schema for `/login` search params.
 */
const searchSchema = z.object({
  redirect: z.string().default('/')
});


/**
 * The route for `/login` endpoint.
 */
export
const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (auth.getUser() !== null) {
      throw redirect({ to: search.redirect })
    }
  },
  component: RouteComponent
});


/**
 * The component that renders the `/login` route.
 */
function RouteComponent() {
  // Fetch the navigate function.
  const navigate = useNavigate();

  // Fetch the search params.
  const { redirect } = Route.useSearch();

  // Create the callback to handle the login.
  const handleLogin = async (options: auth.login.Options) => {
    await auth.login(options);
    await navigate({ to: redirect });
  };

  // Return the rendered component.
  return <Login onLogin={ handleLogin } />;
}
