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
  useConfig
} from '@/config';

import {
  LinkCard
} from './linkcard';


/**
 * A React component that renders the agents cards for the home page.
 */
export
function Agents(): ReactNode {
  // Fetch the Agno OS config.
  const config = useConfig();

  // Bail early if there are no configured agents.
  if (config.agents.length === 0) {
    return null;
  }

  // Create the cards for the agents.
  const cards = config.agents.map(agent =>
    <LinkCard
      key={ agent.agentId }
      to={ `/chat?type=agent&id=${agent.agentId}` }
      title={ `${agent.agentName}` }
      description={ `Create a new chat with the ${agent.agentName} agent` }
      icon={ <MessageSquarePlus size={ 16 } /> } />
  );

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
