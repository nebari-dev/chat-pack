/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from "react";

import {
  cn
} from '@/lib/utils';

import {
  AgentRunsChart, AgentSessionsChart
} from './agents';

import {
  ModelRunsChart
} from './models';

import {
  TeamRunsChart, TeamSessionsChart
} from './teams';

import {
  TokensChart
} from './tokens';

import {
  UsersChart
} from './users';

import {
  WorkflowRunsChart, WorkflowSessionsChart
} from './workflows';


/**
 * A React component that renders the metrics chart page.
 *
 * TODO enable tailwind container queries for this component instead
 * of using the default screen query.
 */
export
function Metrics(): ReactNode {
  return (
    <main className='h-full w-full p-5'>
      <div className={ cn(
        'h-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
        'gap-2 auto-rows-[1fr] overflow-y-auto') }>
        <TokensChart />
        <UsersChart />
        <AgentRunsChart />
        <AgentSessionsChart />
        <TeamRunsChart />
        <TeamSessionsChart />
        <WorkflowRunsChart />
        <WorkflowSessionsChart />
        <ModelRunsChart />
      </div>
    </main>
  );
}
