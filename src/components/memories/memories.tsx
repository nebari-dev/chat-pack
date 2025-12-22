/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from "react";

import {
  DataTable
} from './datatable';


/**
 * A React component that renders agentic user memories.
 */
export
function Memories(): ReactNode {
  return (
    <main className='grow flex flex-col'>
      <div className='px-4 py-2 border-b border-bd-neutral-default'>
        <h2 className='text-lg font-semibold'>
          Memories
        </h2>
      </div>
      <div className='p-4 grow min-h-0 overflow-y-auto'>
        <DataTable />
      </div>
    </main>
  );
}
