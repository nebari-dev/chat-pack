/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';


/**
 * A React component that renders system knowledge.
 */
export
function Knowledge(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <div className='px-4 py-2 border-b border-bd-neutral-default'>
        <h2 className='text-lg font-semibold'>
          Knowledge
        </h2>
      </div>
      <div className='p-4 grow min-h-0 overflow-y-auto'>
        This page is not yet implemented.
      </div>
    </main>
  );
}
