/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useMockUser } from '@/components/auth';
import { ROLE_DEFAULT_ROUTE } from '@/lib/role-navigation';


export const Route = createFileRoute('/login')({
  component: LoginRoute,
});


function LoginRoute() {
  const { authenticate } = useMockUser();
  const navigate = Route.useNavigate();
  const [formState, setFormState] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const user = authenticate(formState.username.trim(), formState.password);
    if (!user) {
      setError('Invalid credentials. Please try again.');
      setSubmitting(false);
      return;
    }
    navigate({ to: ROLE_DEFAULT_ROUTE[user.role], replace: true });
  };

  return (
    <div className='flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-bg-neutral-dark to-bg-white px-6'>
      <div className='w-full max-w-md rounded-xl border border-bd-neutral-default bg-bg-white p-8 shadow-lg'>
        <div className='text-center mb-6'>
          <p className='text-xs uppercase tracking-wide text-gray-500'>Welcome</p>
          <h1 className='text-3xl font-semibold text-gray-900'>Log into School OS</h1>
          <p className='text-sm text-gray-600 mt-2'>Use the credentials provided in <code>docs/mock-credentials.md</code> (replace with Keycloak later).</p>
        </div>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700' htmlFor='username'>Username</label>
            <input
              id='username'
              type='text'
              value={formState.username}
              onChange={event => setFormState(prev => ({ ...prev, username: event.target.value }))}
              className='h-11 rounded-md border border-bd-neutral-default px-3 focus-visible:outline-bd-brand-default'
              placeholder='e.g. alex'
              required
            />
          </div>
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700' htmlFor='password'>Password</label>
            <input
              id='password'
              type='password'
              value={formState.password}
              onChange={event => setFormState(prev => ({ ...prev, password: event.target.value }))}
              className='h-11 rounded-md border border-bd-neutral-default px-3 focus-visible:outline-bd-brand-default'
              placeholder='Enter password'
              required
            />
          </div>
          {error && <p className='text-sm text-red-600'>{error}</p>}
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full h-11 rounded-md bg-bd-brand-default text-white font-semibold disabled:opacity-70'>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
