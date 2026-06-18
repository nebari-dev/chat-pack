/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { Agents } from './agents';

import { Explorer } from './explorer';

/**
 * A React component that renders the home page.
 */
export function Home(): ReactNode {
  return (
    <main className="grow flex flex-col">
      <div className="px-4 py-2 border-b border-bd-neutral-default">
        <h2 className="text-lg font-semibold">Welcome</h2>
      </div>
      <div className="p-4 grow min-h-0 overflow-y-auto flex flex-col gap-4 @container">
        <Explorer />
        <Agents />
      </div>
    </main>
  );
}
