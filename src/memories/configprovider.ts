/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * A type alias for the memories config.
 */
export
type MemoriesConfig = {
  /**
   * The loaded memories from the api.
   */
  readonly page: api.MemoriesPage;

  /**
   * A function that deletes the provided memories by id.
   */
  readonly deleteMemories: (ids: readonly string[]) => Promise<void>;
};


/**
 * The memories config provider.
 */
export
const MemoriesConfigProvider = createContext<MemoriesConfig | undefined>(undefined);


/**
 * A hook which returns the memories config.
 */
export
function useMemoriesConfig(): MemoriesConfig {
  const config = useContext(MemoriesConfigProvider);
  if (config === undefined) {
    throw new Error('missing `MemoriesConfigProvider`');
  }
  return config;
}
