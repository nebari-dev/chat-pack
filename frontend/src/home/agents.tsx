/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  MessageSquarePlus
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useAgents
} from '@/context';

import {
  LinkCard
} from './linkcard';


/**
 * A React component that renders the agents cards for the home page.
 */
export
function Agents(): ReactNode {
  // Fetch the agents.
  const agents = useAgents();

  // Bail early if there are no configured agents.
  if (agents.length === 0) {
    return null;
  }

  // Create the cards for the agents.
  const cards = agents.map(agent => {
    const agentName = agent.capabilities.identity?.name ?? "";
    return (
      <LinkCard
        key={ agent.id }
        to={ `/chat?agentId=${agent.id}` }
        title={ agentName }
        description={ `Create a new chat with ${agentName}` }
        icon={ <MessageSquarePlus size={ 16 } /> } />
    );
  });

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <div className='px-1 py-2 font-semibold border-b border-bd-bd-neutral-default'>
        Agents
      </div>
      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4'>
        { cards }
      </div>
    </div>
  );
}
