/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import type {
  ReactNode
} from 'react';


/**
 * A React component that renders the selector the sessions page.
 */
export
function TypeSelector(): ReactNode {
  return (
    <div className='flex flex-row gap-2'>
      <Private.PillLink type='agent' label='Agent' />
      <Private.PillLink type='team' label='Team' />
      <Private.PillLink type='workflow' label='Workflow' />
    </div>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the `PillLink` props.
   */
  export
  type PillLinkProps = {
    /**
     * The type of the sessions to render.
     */
    readonly type: 'agent' | 'team' | 'workflow';

    /**
     * The label for link.
     */
    readonly label: string;
  };

  /**
   * A React component that renders a pill link for the sessions page.
   */
  export
  function PillLink(props: PillLinkProps): ReactNode {
    // Extract the props.
    const { type, label } = props;

    // Create the active link props.
    const activeProps = {
      className: 'bg-bd-brand-default text-white'
    };

    // Create the inactive link props.
    const inactiveProps = {
      className: 'hover:bg-bg-neutral-dark border border-bd-neutral-default'
    };

    // Return the rendered component.
    return (
      <Link
        to='/sessions/{-$sessionId}'
        className='h-7 w-24 flex justify-center items-center rounded-sm'
        activeProps={ activeProps }
        inactiveProps={ inactiveProps }
        params={ { sessionId: undefined } }
        search={ { type } }>
        { label }
      </Link>
    );
  }
}
