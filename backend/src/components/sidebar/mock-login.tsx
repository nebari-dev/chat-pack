/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ArrowRightLeft, UserRound } from 'lucide-react';

import { useMockUser } from '@/components/auth';
import { cn } from '@/lib/utils';


type Props = {
  readonly isSidebarOpen: boolean;
};


export function MockLogin({ isSidebarOpen }: Props): ReactNode {
  const { user, logout } = useMockUser();

  if (!user) {
    return null;
  }

  return (
    <div className='px-2 pb-3 border-b border-bd-neutral-default'>
      <p className={cn(
        'text-xs uppercase tracking-wide text-gray-500 mb-2',
        isSidebarOpen ? '' : 'text-center'
      )}>
        Active Role
      </p>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-3 rounded-xs border border-bd-neutral-default bg-bg-neutral-dark px-3 py-2'>
          <span className='flex-none w-8 h-8 rounded-full bg-bg-white text-gray-600 flex items-center justify-center'>
            <UserRound size={20} />
          </span>
          <div className={cn('flex flex-col', isSidebarOpen ? '' : 'hidden')}>
            <span className='text-sm font-semibold text-gray-900'>{user.name}</span>
            <span className='text-xs text-gray-600'>{user.persona}</span>
          </div>
        </div>
        <Link
          to='/login'
          onClick={() => logout()}
          className={cn(
            'flex items-center justify-center gap-2 h-9 rounded-xs',
            'bg-bg-brand-secondary text-bd-brand-default font-semibold'
          )}>
          <ArrowRightLeft size={16} />
          <span className={isSidebarOpen ? '' : 'hidden'}>Switch Role</span>
        </Link>
      </div>
    </div>
  );
}
