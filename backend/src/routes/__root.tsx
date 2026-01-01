/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router';

import {
  TanStackRouterDevtools
} from '@tanstack/react-router-devtools';

import type {
  QueryClient
} from '@tanstack/react-query';

import {
  useEffect
} from 'react';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  ConfigProvider
} from '@/components/common';

import {
  MockUserProvider,
  useMockUser
} from '@/components/auth';

import {
  Sidebar
} from '@/components/sidebar';

import {
  ROLE_DEFAULT_ROUTE
} from '@/lib/role-navigation';


/**
 * The root route context.
 */
type RouteContext = {
  queryClient: QueryClient;
};


/**
 * The query params for loading the Agno config.
 */
const configQuery = {
  queryKey: ['config'],
  queryFn: api.getConfig,
  staleTime: 'static'
} as const;


/**
 * The loader function for the config query.
 */
function loadConfig(client: QueryClient): Promise<api.Config> {
  return client.ensureQueryData(configQuery);
}


/**
 * The root route.
 */
export
const Route = createRootRouteWithContext<RouteContext>()({
  loader: ({ context }) => loadConfig(context.queryClient),
  component: RouteComponent
});


/**
 * The component that renders the root route.
 */
function RouteComponent(): ReactNode {
  const config = Route.useLoaderData();

  return (
    <ConfigProvider value={ config }>
      <MockUserProvider>
        <AppLayout />
        <TanStackRouterDevtools position="bottom-right" />
      </MockUserProvider>
    </ConfigProvider>
  );
}


function AppLayout(): ReactNode {
  const { user } = useMockUser();
  const location = useLocation();
  const navigate = Route.useNavigate();

  const isLoginRoute = location.pathname === '/login';

  useEffect(() => {
    if (!user && !isLoginRoute) {
      navigate({ to: '/login', replace: true });
    }
  }, [user, isLoginRoute, navigate]);

  useEffect(() => {
    if (user && isLoginRoute) {
      navigate({ to: ROLE_DEFAULT_ROUTE[user.role], replace: true });
    }
  }, [user, isLoginRoute, navigate]);

  if (!user) {
    if (!isLoginRoute) {
      return null;
    }
    return <Outlet />;
  }

  if (isLoginRoute) {
    return null;
  }

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar />
      <div className='flex-auto min-h-screen overflow-auto bg-bg-neutral-dark'>
        <Outlet />
      </div>
    </div>
  );
}
