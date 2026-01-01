/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';


type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly children?: ReactNode;
};


export function RoleViewShell({ title, subtitle, children }: Props): ReactNode {
  return (
    <section className='p-6 space-y-4'>
      <header>
        <h1 className='text-2xl font-semibold text-gray-900'>{title}</h1>
        <p className='text-sm text-gray-500'>{subtitle}</p>
      </header>
      <div className={cn(
        'rounded-md border border-bd-neutral-default bg-bg-white',
        'p-6 text-gray-600'
      )}>
        {children ?? 'Coming soon.'}
      </div>
    </section>
  );
}
