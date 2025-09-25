/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  memo, useMemo
} from 'react';

import {
  useAppStore
} from '../../store';

import './requestrenderer.css';


/**
 * A React component that renders a request in a chat.
 *
 * #### Notes
 * This component assumes that `chatId` and `runId` exist in the store.
 */
export
function RequestRenderer(props: RequestRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId } = props;

  // Fetch the run from the store.
  const run = useAppStore(store => {
    const chat = store.chats.find(chat => chat.id === chatId)!;
    return chat.runs.find(run => run.id === runId)!;
  });

  // Fetch the files from the store.
  const storeFiles = useAppStore(store => store.files);

  // Memoised computation of the request text and files.
  const { runText, files } = useMemo(() => {

    // Create the request text for the run.
    const runText = run.request.parts.filter(part =>
      part.kind === 'text'
    ).flatMap(part =>
      part.data.content_parts
    ).join('');

    // Create the request files for the run.
    const runFileIds = run.request.parts.filter(part =>
      part.kind === 'file'
    ).map(part =>
      part.data.file_id
    );

    // Get file data based on IDs
    const files = [...new Set(runFileIds)]
    .flatMap(id => {
      const files = storeFiles.find(file => file.id === id);
      return files ? [files] : [];
    });

    return { runText, files };
  }, [run, storeFiles]);

  // Return the rendered component.
  return (
    <>
      {/* File list above */}
      {files.length > 0 && (
        <div className="chat-RequestFileList">
          {files.map(file => (
            <div key={file.id} className="chat-RequestFileBox">
              <div className="chat-RequestFileName">{file.name}</div>
              <div className="chat-RequestFileType">
                {file.content_type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request text inside chat box */}
      <div className="chat-RequestRenderer">
        <p>{runText}</p>
      </div>
    </>
  );
}


/**
 * A memoized version of `RequestRenderer`.
 */
export
const RequestRendererMemo = memo(RequestRenderer);


/**
 * The namespace for the `RequestRenderer` component statics.
 */
export
namespace RequestRenderer {
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
