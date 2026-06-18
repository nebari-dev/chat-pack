/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { PageNav } from './pagenav';

import { ThreadsTable } from './threadstable';

/**
 * A React component that renders the session history page.
 */
export function History(): ReactNode {
  return (
    <main className="grow flex flex-col">
      <div className="px-4 py-2 border-b border-bd-neutral-default">
        <h2 className="text-lg font-semibold">History</h2>
      </div>
      <ThreadsTable />
      <PageNav />
    </main>
  );
}
