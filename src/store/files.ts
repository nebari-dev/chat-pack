/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  StateCreator
} from 'zustand';

import * as Hrafnar from '@/hrafnar';


/**
 * A type alias for the Files slice.
 */
export
type FilesSlice = {
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  /**
   * The available uploaded files in the application.
   */
  readonly files: readonly Hrafnar.FileInfo[];

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  /**
   * Initialize the `FilesSlice`.
   */
  readonly initializeFiles: () => Promise<void>;

  /**
   * Upload remote files to the server with URL download links.
   */
  readonly uploadRemoteFiles:
    (specs: readonly Hrafnar.RemoteFileSpec[]) => Promise<void>;

  /**
   * Delete a file from the store.
   *
   * This will remove the file from the store and delete it on the server.
   *
   * If a file with the given `id` does not exist, the function is a no-op,
   * but a message will be logged to the console.
   */
  readonly deleteFile: (id: string) => Promise<void>;
};


/**
 * Create the Files slice for the store.
 */
export
const createFilesSlice: StateCreator<FilesSlice> = (set, get) => ({
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  // Initial list of files.
  files: [],

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  // Initialize the files slice.
  initializeFiles: async () => {
    // Get the files from Hrafnar.
    const files = await Hrafnar.getFiles();

    // Update the store.
    set({ files });
  },

  // Upload remote files to the server.
  uploadRemoteFiles: async (specs: readonly Hrafnar.RemoteFileSpec[]) => {
    // Upload the new files to Hfranar.
    const files = await Hrafnar.uploadRemoteFiles(specs);

    // Update the store with the new files.
    set({ files: [...get().files, ...files] });
  },

  // Delete a file from the store and server.
  deleteFile: async (id: string) => {
    // Delete the file on Hrafnar.
    await Hrafnar.deleteFile(id);

    // Filter the files to remove the target.
    const files = get().files.filter(file => file.id !== id);

    // Update the store.
    set({ files });
  },
});
