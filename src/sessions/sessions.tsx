/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  cn
} from '@/lib/utils';

import {
  SessionsTable
} from './sessionstable';

import {
  TypeSelector
} from './typeselector';


/**
 * A React component that renders session history.
 */
export
function Sessions(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <div className={ cn(
        'px-4 py-2 border-b border-bd-neutral-default',
        'flex flex-row justify-between items-center') }>
        <h2 className='text-lg font-semibold'>
          Sessions
        </h2>
        <TypeSelector />
      </div>
      <div className='p-4 grow min-h-0 overflow-y-auto'>
        <SessionsTable />
      </div>
    </main>
  );
}
