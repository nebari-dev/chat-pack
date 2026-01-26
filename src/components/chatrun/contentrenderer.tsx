/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import rehypeKatex from 'rehype-katex';

import remarkGfm from 'remark-gfm';

import remarkMath from 'remark-math';

import Markdown from 'react-markdown';

import * as api from '@/api';


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
  //
  // The markdown elements are formatted in `main.css` based on the
  // `ot-ChatPlusPlus-markdown` class name. Do not remove it.
  return (
    <div className='ot-ChatPlusPlus-markdown'>
      <Markdown
        remarkPlugins={ [remarkGfm, remarkMath] }
        rehypePlugins={ [rehypeKatex] }
        components={ Private.markdownComponents }>
        { content }
      </Markdown>
    </div>
  );
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

    // If the last event is `RunCompleted`, use that as the truth.
    const lastEvent = events[events.length - 1];
    if (lastEvent.event === 'RunCompleted') {
      return lastEvent.content;
    }

    // Otherwise, join the `RunContent` events.
    return events.reduce((content, e) => {
      return content + (e.event === 'RunContent' ? e.content : '');
    }, '');
  }

  /**
   * The custom markdown components.
   *
   * These handle the tags that can't be handled solely in `main.css`.
   */
  export
  const markdownComponents = {
    table: ({ ...props }) => (
      <div className='my-6 w-full border rounded-md overflow-x-auto'>
        <table { ...props } />
      </div>
    )
  } as const;
}
