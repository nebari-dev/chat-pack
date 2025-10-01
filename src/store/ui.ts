/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  Draft
} from 'immer';

import {
  castDraft, produce
} from 'immer';

import {
  DockPanel
} from 'otui/containers';

import type {
  StateCreator
} from 'zustand';


/**
 * A type alias for a chat panel specification.
 */
export
type ChatPanelSpec = {
  /**
   * The discriminated type of the panel.
   */
  readonly type: 'chat-panel';

  /**
   * The unique id of panel.
   *
   * This will be the server-generated id of the chat.
   */
  readonly id: string;
};


/**
 * A type union of the supported panel spec types.
 */
export
type PanelSpec = ChatPanelSpec;


/**
 * A type alias for the side bar state.
 */
export
type SideBarState = 'none' | 'chats' | 'files';


/**
 * A type alias for the UI slice.
 */
export
type UISlice = {
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  /**
   * The specs for the panels available for display.
   */
  readonly panelSpecs: readonly PanelSpec[];

  /**
   * The current state of the `SideBar`.
   */
  readonly sideBarState: SideBarState;

  /**
   * The current dock layout for the application.
   *
   * The keys in the layout are the unique panel spec ids.
   *
   * This will always be a normalized layout.
   */
  readonly dockLayout: DockPanel.DockLayout | null;

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  /**
   * Check whether a panel is open in the dock area.
   */
  readonly isPanelOpen: (id: string) => boolean;

  /**
   * Open a panel in the dock area, or select the tab if it's already open.
   *
   * If a panel with the given `id` does not exist, the function is a no-op,
   * but a message will be logged to the console.
   */
  readonly openPanel: (id: string) => void;

  /**
   * Close a panel in the dock area, but do not delete it.
   *
   * The panel can be later re-opened by calling `openPanel`.
   *
   * If a panel with the given `id` does not exist, the function is a no-op,
   * but a message will be logged to the console.
   */
  readonly closePanel: (id: string) => void;

  /**
   * The function to toggle the `SideBar` state.
   */
  readonly toggleSideBarState: (state: SideBarState) => void;

  /**
   * The function to set the dock layout for the application.
   *
   * This is used by the dock area component to set the layout as the user
   * rearranges the dock area. This should never be called by user code.
   */
  readonly setDockLayout: (layout: DockPanel.DockLayout) => void;
};


/**
 * Create the UI slice for the store.
 */
export
const createUISlice: StateCreator<UISlice> = (set, get) => ({
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  // Initial list of panel specs.
  panelSpecs: [],

  // Initial side bar state.
  sideBarState: 'none',

  // Initial dock layout.
  dockLayout: null,

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  // Check whether a panel is open.
  isPanelOpen: (id: string) => {
    // Fetch the dock layout from the store.
    const layout = get().dockLayout;

    // Bail early if the layout is null.
    if (layout === null) {
      return false;
    }

    // Find a tab layout that includes the chat id.
    const tl = DockPanel.findTabLayout(layout, tl => tl.keys.includes(id));

    // Return whether the panel was found.
    return tl !== null;
  },

  // Open an existing panel.
  openPanel: (id: string) => {
    set(produce((draft: Draft<UISlice>) => {
      // Find the spec for the given id.
      const spec = draft.panelSpecs.find(spec => spec.id === id);

      // Bail if the panel spec is not found
      if (!spec) {
        console.error(`openPanel(): panel spec not found ${id}`);
        return;
      }

      // If the dock layout is null, create a new layout with just this chat.
      if (draft.dockLayout === null) {
        // Create the new dock layout.
        const dockLayout = DockPanel.createTabLayout([id]);

        // Update the draft.
        draft.dockLayout = castDraft(dockLayout);

        // Done.
        return;
      }

      // Find the tab layout which contains the chat id.
      const tabLayout = DockPanel.findTabLayout(draft.dockLayout, layout => {
        return layout.keys.includes(id);
      });

      // If a containing tab layout was foud, just select the tab.
      if (tabLayout !== null) {
        // Get the index of the tab.
        const index = tabLayout.keys.indexOf(id);

        // If the index is already selected, do nothing.
        if (index === tabLayout.selectedIndex) {
          return;
        }

        // Create the new dock layout with the tab selected.
        const dockLayout = DockPanel.selectTab(
          draft.dockLayout, tabLayout.uuid!, index
        );

        // Update the draft.
        draft.dockLayout = castDraft(dockLayout);

        // Done.
        return;
      }

      // Find the first tab layout in the dock layout.
      //
      // This could be made more intelligent in the future. For example,
      // to find the tab area which last had user input focus.
      const first = DockPanel.findTabLayout(draft.dockLayout, () => true);

      // This should never happen, but guard against it anyway.
      if (first === null) {
        console.error('openPanel(): malformed dock layout');
        return;
      }

      // Create the new dock layout with the inserted tab.
      const dockLayout = DockPanel.insertTab(
        draft.dockLayout, first.uuid!, id, first.keys.length
      );

      // Update the draft.
      draft.dockLayout = castDraft(dockLayout);
    }));
  },

  // Close an exisiting panel.
  closePanel: (id: string) => {
    set(produce((draft: Draft<UISlice>) => {
      // Find the spec for the given id.
      const spec = draft.panelSpecs.find(spec => spec.id === id);

      // Bail if the panel spec is not found
      if (!spec) {
        console.error(`closePanel(): panel spec not found ${id}`);
        return;
      }

      // If the dock layout is null we are done.
      if (draft.dockLayout === null) {
        return;
      }

      // Find the tab layout which contains the chat id.
      const tabLayout = DockPanel.findTabLayout(draft.dockLayout, layout => {
        return layout.keys.includes(id);
      });

      // If a containing tab layout was not found, we are done.
      if (tabLayout === null) {
        return;
      }

      // Remove the tab from the layout
      const dockLayout = DockPanel.removeTab(
        draft.dockLayout, tabLayout.uuid!, tabLayout.keys.indexOf(id)
      );

      // If the new layout is an empty tab layout, reset the layout to `null`.
      if (dockLayout.type === 'tab-layout' && dockLayout.keys.length === 0) {
        draft.dockLayout = null;
        return;
      }

      // Update the docklayout.
      draft.dockLayout = castDraft(dockLayout);
    }));
  },

  // Toggle the side bar state.
  toggleSideBarState: (state: SideBarState) => {
    const newState = get().sideBarState === state ? 'none' : state;
    set({ sideBarState: newState });
  },

  // Set the dock layout.
  setDockLayout: (layout: DockPanel.DockLayout) => {
    set({ dockLayout: DockPanel.normalizeLayout(layout) });
  }
});
