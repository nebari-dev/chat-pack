/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  ConfigAccordion
} from "@/components/agent-config/configaccordion"

import {
  useDetailConfig
} from './agentconfigprovider'

export function ConfigDetails(): ReactNode {
  // Fetch config
  const data = useDetailConfig();

  // Return rendered component
  return (
    <main className="w-full">
      <h2 className="m-5 text-xl font-bold">{data.name}</h2>

      <div className="w-1/3 mx-auto">
        <ConfigAccordion data={data} />
      </div>
    </main>
  );
}
