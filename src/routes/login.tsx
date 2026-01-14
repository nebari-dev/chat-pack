import {
  createFileRoute,
  useNavigate,
  redirect
} from '@tanstack/react-router';

import {
  useAuth
} from "@/login//authconfigprovider";

import {
  Login
} from '@/login'


export const Route = createFileRoute('/login')({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || '/',
  }),
  beforeLoad: ({ context, search}) => {
    // Redirect if already authenticated
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect })
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { redirect: redirectTo } = Route.useSearch()

  const handleLogin = async (email: string, password: string) => {
    await auth.login({ email, password });
    await navigate({ to: redirectTo });
  };

  return <Login submit={handleLogin} />;
}
