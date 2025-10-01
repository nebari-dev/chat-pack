/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  clsx
} from 'clsx';

import {
  Trash2
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  useCallback
} from 'react';

import {
  useShallow
} from 'zustand/react/shallow';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore,
} from '@/store';


/**
 * A React component that renders the `files` panel for the side bar.
 */
export
function FilesPanel(): ReactNode {
  return (
    <div className='h-full flex flex-col gap-6'>
      <UploadButton />
      <FileList />
    </div>
  );
}


/**
 * A React component that renders the file list in the files panel.
 */
function FileList(): ReactNode {
  // Fetch the file ids from the store.
  const fileIds = useAppStore(useShallow(store =>
    store.files.map(file => file.id)
  ));

  // Create the file items for the file list.
  const files = fileIds.map(fileId =>
    <FileItem key={ fileId } fileId={ fileId } />
  );

  // Return the rendered component.
  return (
    <div className={ clsx(
      'flex flex-col flex-auto min-h-0 gap-2 select-none'
      ) }>
      <h1 className='flex-none text-xl'>
        Files
      </h1>
      <div className='flex-auto overflow-y-auto'>
        <ul className='flex flex-col gap-3'>
          { files }
        </ul>
      </div>
    </div>
  );
}


/**
 * A React component that renders an item in the file list.
 */
function FileItem(props: FileItem.Props): ReactNode {
  // Extract the props.
  const { fileId } = props;

  // Fetch the `deleteFile` function from the store.
  const deleteFile = useAppStore(store => store.deleteFile);

  // Fetch the file name from the store.
  const fileName = useAppStore(store =>
    store.files.find(f => f.id === fileId)!.name
  );

  // Set up the click handler to delete the file.
  const handleDelete = () => { deleteFile(fileId); };

  // Return the rendered component.
  return (
    <li className=
      'px-3 h-10 flex items-center justify-between whitespace-nowrap'>
      <span
        className={ clsx(
          'flex-1 min-w-0 text-text-neutral-default',
          'overflow-hidden text-ellipsis'
        ) }>
        { fileName }
      </span>
      <span className='cursor-pointer' onClick={ handleDelete }>
        <Trash2 size={ 16 } />
      </span>
    </li>
  );
}


/**
 * The namespace for the `FileItem` component statics.
 */
namespace FileItem {
  /**
   * A type alias for the `FileItem` props.
   */
  export
  type Props = {
    /**
     * The unique id of the file.
     */
    readonly fileId: string;
  };
}


/**
 * A react component which renders the dropbox upload button.
 */
function UploadButton(): ReactNode {
  // Get the `uploadFiles` function from the store.
  const uploadRemoteFiles = useAppStore(store => store.uploadRemoteFiles);

  // Handle click event for the upload button.
  const handleClick = useCallback(() => {
    window.Dropbox!.choose({
      linkType: 'direct',
      multiselect: true,
      extensions: ['.pdf', '.jpg', '.png'],
      success: async files => {
        // Convert the dropbox files to upload specs.
        const specs = files.map(convertDropboxFile);

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
 * Convert a Dropbox `ChooserFile` to a `FileUploadSpec`.
 */
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
