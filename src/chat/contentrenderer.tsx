/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import * as api from '@/api';

import {
  MarkdownRenderer
} from '@/components/markdown/markdownrenderer';


/**
 * A react component that renders the assistant content for a run.
 */
export
function ContentRenderer(props: ContentRenderer.Props): ReactNode {
  // Extract the props.
  const { events } = props;

  // Create the assistant content from the events.
  const content = Private.createContent(events);

  // Bail if there is no content to render.
  if (!content) {
    return null;
  }

  // Return the rendered component.
  return <MarkdownRenderer content={ content } />;
}


/**
 * The namespace for the `ContentRenderer` statics.
 */
export
namespace ContentRenderer {
  /**
   * A type alias for the `ContentRenderer` props.
   */
  export
  type Props = {
    /**
     * The api events for the run.
     */
    readonly events: readonly api.RunEvent[];
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the assistant content string from an array of run events.
   */
  export
  function createContent(events: readonly api.RunEvent[]): string {
    // Bail early if the events array is empty.
    if (events.length === 0) {
      return '';
    }

    // If the last event is `run-completed`, use that as the truth.
    const lastEvent = events[events.length - 1];
    if (lastEvent.type === 'run-completed') {
      return lastEvent.content;
    }

    // Otherwise, join the `RunContent` events.
    return events.reduce((content, e) => {
      return content + (e.type === 'run-content' ? e.content : '');
    }, '');
  }
}
