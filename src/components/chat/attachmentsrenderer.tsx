/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow'

import {
  useAppStore
} from '@/store';

import './attachmentsrenderer.css';


/**
 * A React component that renders request attachments.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function AttachmentsRenderer(props: AttachmentsRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId } = props;

  // Collect the files attached to the run.
  const files = useAppStore(useShallow(store => {
    // Find the chat/run
    const chat = store.chats.find(chat => chat.id === chatId)!;
    const run = chat.runs.find(run => run.id === runId)!;

    // Collect all file IDs from the run parts.
    const fileIds = run.request.parts
      .filter(part => part.kind === 'file')
      .map(part => part.data.file_id);

    // Map IDs -> file objects from the store and drop any misses.
    return fileIds.flatMap(id => store.files.find(f => f.id === id)!);
  }));

  // Create the content for the files.
  const content = files.map(file =>
    <div key={ file.id } className='chat-AttachmentsRenderer-file'>
      { file.name }
    </div>
  );

  // Return the rendered component.
  return (
    content.length === 0 ? null :
    <div className='chat-AttachmentsRenderer'>
      { content }
    </div>
  );
}


/**
 * A memoized version of `AttachmentsRenderer`.
 */
export
const AttachmentsRendererMemo = memo(AttachmentsRenderer);


/**
 * The namespace for the `RequestRenderer` component statics.
 */
export
namespace AttachmentsRenderer {
  /**
   * A type alias for the `RequestRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id for the chat.
     */
    readonly chatId: string;

    /**
     * The unique id of the chat run.
     */
    readonly runId: string;
  };
}
