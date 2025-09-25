/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  StateCreator
} from 'zustand';

import * as Hrafnar from '@/hrafnar';


/**
 * A type alias for the Info slice.
 */
export
type InfoSlice = {
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  /**
   * The available models in the application.
   */
  readonly models: readonly Hrafnar.Model[];

  /**
   * The available tools in the application.
   */
  readonly tools: readonly Hrafnar.Tool[];

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  /**
   * Initialize the info slice.
   */
  readonly initializeInfo: () => Promise<void>;
};


/**
 * Create the Info slice for the store.
 */
export
const createInfoSlice: StateCreator<InfoSlice> = (set, _get) => ({
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  // Initial list of models.
  models: [],

  // Initial list of tools.
  tools: [],

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/
  initializeInfo: async () => {
    // Get the info from Hrafnar.
    const { models, toolsets } = await Hrafnar.getInfo();

    // Update the store.
    set({ models, tools: toolsets });
  }
});
