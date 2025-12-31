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
 * A React component that renders the teams cards for the home page.
 */
export
function Teams(): ReactNode {
  // Fetch the Agno OS config.
  const config = useConfig();

  // Bail early if there are no configured teams.
  if (config.teams.length === 0) {
    return null;
  }

  // Create the cards for the teams.
  const cards = config.teams.map(team =>
    <LinkCard
      key={ team.id }
      to={ `/chat?type=team&id=${team.id}` }
      title={ `${team.name}` }
      description={ `Create a new chat with the ${team.name} team` }
      icon={ <MessageSquarePlus size={ 16 } /> } />
  );

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <div className='px-1 py-2 font-semibold border-b border-bd-bd-neutral-default'>
        Teams
      </div>
      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4'>
        { cards }
      </div>
    </div>
  );
}
