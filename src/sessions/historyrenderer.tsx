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
 * A react component that renders the session history in the detail panel.
 */
export
function HistoryRenderer(props: HistoryRenderer.Props): ReactNode {
  // Extract the props.
  const { detail } = props;

  // TODO handle more than just agent history.
  if (detail.type !== 'agent') {
    return null;
  }

  // Create the content from the chat history.
  //
  // This renders from the chat history, which is a dumbed-down version of
  // the entire chat. That's what we want here. It should be fast to render,
  // skip all the tool calls, etc. Just a quick summary. The user can always
  // re-open the session to get the full-monty.
  const content = detail.chat_history.map((msg, i) => {
    if (msg.role === 'user') {
      return (
        <div
          key={ `user-${i}` }
          className='flex flex-row justify-end'>
          <div className='px-4 py-2 rounded-md bg-bg-neutral-dark'>
            { msg.content ?? '' }
          </div>
        </div>
      );
    }
    if (msg.role === 'assistant') {
      return (
        <MarkdownRenderer
          key={ `assistant-${i}` }
          content={ msg.content ?? '' } />
      );
    }
    return null;
  });

  // Return the rendered component.
  return (
    <div className='p-4 grow min-h-0 overflow-y-auto'>
      { content }
    </div>
  );
}


/**
 * The namespace for the `HistoryRenderer` statics.
 */
export
namespace HistoryRenderer {
  /**
   * A type alias for the `HistoryRenderer` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}
