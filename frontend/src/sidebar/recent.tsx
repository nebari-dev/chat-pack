/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  useQuery
} from '@tanstack/react-query';

import {
  Link
} from '@tanstack/react-router';

import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  Separator
} from '@/components/ui/separator';

import {
  threadPageQuery
} from '@/queries';


/**
 * A react component that renders the recent threads in the sidebar.
 */
export
function Recent(props: Recent.Props): ReactNode {
  // Extract the props.
  const { isSidebarOpen } = props;

  // Fetch the most recent threads.
  //
  // Note: Sorting is done client-side by computed updatedAt (latest run
  // createdAt), since the server no longer provides updatedAt.
  const page = useQuery(threadPageQuery({
    pageSize: 5,
    pageNumber: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }));

  // Bail early if the sidebar is not open.
  if (!isSidebarOpen) {
    return null;
  }

  // Sort threads by computed updatedAt (latest run's createdAt) and create links.
  const threads = (page.data?.items || []).slice()
    .sort((a, b) => api.getThreadUpdatedAt(b).localeCompare(api.getThreadUpdatedAt(a)));

  const links = threads.map(thread =>
    <Private.ThreadLink key={ thread.id } thread={ thread } />
  );

  // Create the content for the section.
  const content = (
    links.length > 0 ? links :
    <div className='py-1 text-muted-foreground'>
      Recently modified threads will appear here.
    </div>
  );

  // Return the rendered component.
  return (
    <div>
      <Separator />
      <section
        className='px-4 py-2 overflow-hidden'
        arial-label='Recent threads'>
        <h1 className='font-semibold'>Recent</h1>
        { content }
      </section>
    </div>
  );
}


/**
 * The namespace for the `Recent` statics.
 */
export
namespace Recent {
  /**
   * A type alias for the `Recent` props.
   */
  export
  type Props = {
    /**
     * Whether the sidebar is open.
     */
    readonly isSidebarOpen: boolean;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders a thread link in the sidebar.
   */
  export
  function ThreadLink(props: ThreadLink.Props): ReactNode {
    // Extract the props.
    const { thread } = props;

    // Define the active link props.
    const activeProps = {
      className: 'text-bd-brand-default'
    };

    // Define the inactive link props.
    const inactiveProps = {
      className: 'text-muted-foreground'
    };

    // Return the rendered component.
    return (
      <Link
        className='block truncate py-1'
        to='/chat'
        search={ { threadId: thread.id } }
        activeProps={ activeProps }
        inactiveProps={ inactiveProps }>
        { thread.name || 'Untitled Thread' }
      </Link>
    );
  }

  /**
   * The namespace for the `ThreadLink` statics.
   */
  export
  namespace ThreadLink {
    /**
     * A type alias for the `ThreadLink` props.
     */
    export
    type Props = {
      /**
       * The thread object for the link.
       */
      readonly thread: api.Thread;
    };
  }
}
