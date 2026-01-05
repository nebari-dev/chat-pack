/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ExternalLink, X
} from 'lucide-react';

import {
  Link
} from '@tanstack/react-router';

import type {
  ReactNode
} from 'react';

import {
  useCallback
} from 'react';

import * as api from '@/api';

import {
  ToggleGroup, ToggleGroupItem
} from '@/components/ui/toggle-group';


/**
 * A react component the renders the header for the detail panel.
 */
export
function DetailHeader(props: DetailHeader.Props): ReactNode {
  // Extract the props.
  const { detail, tabId, setTabId } = props;

  // Compute the actor id for the detail type.
  let actorId: string;
  switch (detail.type) {
  case 'agent':
    actorId = detail.agent_id;
    break;
  case 'team':
    actorId = detail.team_id;
    break;
  case 'workflow':
    actorId = detail.workflow_id;
    break;
  default:
    throw 'unreachable'
  }

  // Create the search params for launching the chat.
  const params = new URLSearchParams();
  params.append('type', detail.type);
  params.append('sessionId', detail.session_id);
  params.append('id', actorId);

  // Create the URL for navigating to the chat.
  const chatUrl = `/chat?${params}`;

  // Create the tab change handler that ignores invalid input. This also
  // has the effect of disallowing de-selection in the toggle group.
  const handleTabChange = useCallback((id: string) => {
    switch (id) {
    case 'history':
    case 'metrics':
    case 'details':
      setTabId(id);
      break;
    default:
      break;
    }
  }, []);

  // Return the rendered component.
  return (
    <div className='border-b border-bd-neutral-default'>
      <div className={
        'py-2 px-4 flex flex-row gap-2 items-center justify-between' }>
        <h2 className='text-lg font-semibold truncate'>
          { detail.session_name }
        </h2>
        <div className='flex flex-row gap-2'>
          <Link
            to={ chatUrl }
            className='p-1 rounded-sm hover:bg-bg-neutral-dark'
            aria-label='open chat'>
            <ExternalLink size={ 20 } />
          </Link>
          <Link
            className='p-1 rounded-sm hover:bg-bg-neutral-dark'
            aria-label='close'
            to='..'
            search={ prev => prev }>
            <X size={ 20 } />
          </Link>
        </div>
      </div>
      <ToggleGroup
        className='py-2 px-4'
        type='single'
        variant='outline'
        size='sm'
        value={ tabId }
        onValueChange={ handleTabChange }>
        <ToggleGroupItem value='history' aria-label='history'>
          History
        </ToggleGroupItem>
        <ToggleGroupItem value='metrics' aria-label='metrics'>
          Metrics
        </ToggleGroupItem>
        <ToggleGroupItem value='details' aria-label='details'>
          Details
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}


/**
 * The namespace for the `DetailHeader` statics.
 */
export
namespace DetailHeader {
  /**
   * A type alias for the header tab ids.
   */
  export
  type TabId = 'history' | 'metrics' | 'details';

  /**
   * A type alias for the `DetailHeader` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;

    /**
     * The selected tab id.
     */
    readonly tabId: TabId;

    /**
     * A callback to set the selected tab id.
     */
    readonly setTabId: (id: TabId) => void;
  };
}
