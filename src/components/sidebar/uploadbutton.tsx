/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import type {
  ReactNode
} from 'react';

import {
  useCallback
} from 'react';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore
} from '@/store';


/**
 * A react component which renders the dropbox upload button.
 */
export
function UploadButton(): ReactNode {
  // Get the `uploadFiles` function from the store.
  const uploadRemoteFiles = useAppStore(store => store.uploadRemoteFiles);

  // Handle click event for the upload button.
  const handleClick = useCallback(() => {
    Dropbox.choose({
      linkType: 'direct',
      multiselect: true,
      extensions: ['.pdf', '.jpg', '.png'],
      success: async files => {
        // Convert the dropbox files to upload specs.
        const specs = files.map(Private.convertDropboxFile);

        // Upload the files.
        await uploadRemoteFiles(specs);
      }
    });
  }, [uploadRemoteFiles]);

  // Return the rendered component.
  return (
    <button
      onClick={ handleClick }
      className={ clsx(
        'sidebar-UploadButton px-3 py-1 flex flex-row gap-2 justify-center',
        'items-center bg-bg-neutral-default border border-bd-neutral-default',
        'rounded-sm whitespace-nowrap cursor-pointer'
      ) }>
      <span className={ clsx(
        'bg-[url(/assets/dropboxicon.svg)] h-4 w-4 inline-block',
        'bg-size-[auto_16px] bg-center bg-no-repeat'
      ) }/>
      Upload Files
    </button>
  );
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a Dropbox `ChooserFile` to a `FileUploadSpec`.
   */
  export
  function convertDropboxFile(file: Dropbox.ChooserFile): Hrafnar.RemoteFileSpec {
    return {
      name: file.name,
      size: file.bytes,
      content_type: mapContentType(file.name),
      external_url: { path: file.link }
    };
  }

  /**
   * Map a file extension to a content MIME type.
   */
  function mapContentType(name: string): string {
    if ((/\.pdf$/i).test(name)) {
      return 'application/pdf';
    }
    if ((/\.jpg$/i).test(name)) {
      return 'image/jpeg';
    }
    if ((/\.png$/i).test(name)) {
      return 'image/png';
    }
    return 'text/plain';
  }
}
