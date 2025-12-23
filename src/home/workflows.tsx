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
} from '@/components/common';

import {
  LinkCard
} from './linkcard';


/**
 * A React component that renders the workflow cards for the home page.
 */
export
function Workflows(): ReactNode {
  // Fetch the Agno OS config.
  const config = useConfig();

  // Bail early if there are no configured workflows.
  if (config.workflows.length === 0) {
    return null;
  }

  // Create the cards for the workflows.
  const cards = config.workflows.map(workflow =>
    <LinkCard
      to={ `/chat?type=workflow&id=${workflow.id}` }
      title={ `${workflow.name}` }
      description={ `Create a new chat with the ${workflow.name} workflow` }
      icon={ <MessageSquarePlus size={ 16 } /> } />
  );

  // Return the rendered component.
  return (
    <div className='flex flex-col gap-4'>
      <div className='px-1 py-2 font-semibold border-b border-bd-bd-neutral-default'>
        Workflows
      </div>
      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4'>
        { cards }
      </div>
    </div>
  );
}
