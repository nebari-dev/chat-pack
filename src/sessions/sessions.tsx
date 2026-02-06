/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  SessionDetail
} from './sessiondetail';

import {
  SessionsTable
} from './sessionstable';

import {
  useSessionsConfig
} from './configprovider';


/**
 * A React component that renders the session history page.
 */
export
function Sessions(): ReactNode {
  // Extract the detail and runs from the config.
  const { detail } = useSessionsConfig();

  // Return the rendered component.
  return (
    <main className='grow flex flex-col'>
      <div className='px-4 py-2 border-b border-bd-neutral-default'>
        <h2 className='text-lg font-semibold'>
          Sessions
        </h2>
      </div>
      <div className='grow grid grid-flow-col auto-cols-fr min-h-0'>
        <SessionsTable />
        { detail ? <SessionDetail detail={ detail } /> : null }
      </div>
    </main>
  );
}
