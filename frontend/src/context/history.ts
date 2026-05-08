/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * The configuration for the history page.
 */
export
type HistoryConfig = {
  /**
   * The loaded history page from the api.
   */
  readonly page: api.ThreadPage;

  /**
   * A function that deletes the provided threads by id.
   */
  readonly deleteThreads: (ids: readonly string[]) => Promise<void>;
};


/**
 * The history config context.
 */
export
const HistoryConfigContext = createContext<HistoryConfig | undefined>(undefined);


/**
 * A hook which returns the history config.
 */
export
function useHistoryConfig(): HistoryConfig {
  const config = useContext(HistoryConfigContext);
  if (config === undefined) {
    throw new Error('`useHistoryConfig` must be called within a `HistoryConfigContext`');
  }
  return config;
}
