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
} from '../../store';

import './requestattachmentsrenderer.css';


/**
 * A React component that renders a request in a chat.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function RequestAttachmentsRenderer(props: RequestAttachmentsRenderer.Props): ReactNode {

  // // Extract the props.
  const { chatId, runId } = props;

  const fileList = useAppStore(
  useShallow(store => {
    // Find the chat/run
    const chat = store.chats.find(chat => chat.id === chatId)!;
    const run = chat.runs.find(run => run.id === runId)!;

    // Collect all file IDs from the run parts.
    const fileIds = run.request.parts
      .filter(part => part.kind === 'file')
      .map(part => part.data.file_id);

    // Map IDs -> file objects from the store and drop any misses.
    const files = fileIds.flatMap(id => {
      const file = store.files.find(f => f.id === id);
      return file ? [file] : [];
    });

    return files;
  })
);

  // Return the rendered component.
  return (
    <div className=''>
      {fileList.length > 0 && (
        <div className="chat-RequestFileList">
          {fileList.map(file => (
            <div key={file.id} className="chat-RequestFileBox">
              <div className="chat-RequestFileName">{file.name}</div>
              <div className="chat-RequestFileType">{file.content_type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/**
 * A memoized version of `RequestRenderer`.
 */
export
const RequestAttachmentsRendererMemo = memo(RequestAttachmentsRenderer);


/**
 * The namespace for the `RequestRenderer` component statics.
 */
export
namespace RequestAttachmentsRenderer {
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
