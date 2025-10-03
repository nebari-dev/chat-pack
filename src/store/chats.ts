/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  Draft
} from 'immer';

import {
  castDraft, produce
} from 'immer';

import type {
  StateCreator
} from 'zustand';

import * as Hrafnar from '@/hrafnar';

import type {
  ChatPanelSpec, UISlice
} from './ui';


/**
 * A type alias for the Chats slice.
 */
export
type ChatsSlice = {
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  /**
   * The current chat tasks in the application.
   */
  readonly chats: readonly Hrafnar.ChatTask[];

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  /**
   * Initialize the chats for the application.
   */
  readonly initializeChats: () => Promise<void>;

  /**
   * Create a new chat for the application.
   *
   * This function creates a new chat on the server, creates `chat-panel`,
   * adds it to the `panels` record, and opens a new tab in the dock area
   * for interacting with the chat.
   */
  readonly createChat: () => Promise<void>;

  /**
   * Delete a chat from the store.
   *
   * This will remove the `chat-panel` from the store and delete its contents
   * from the server.
   *
   * If a chat with the given `id` does not exist, the function is a no-op,
   * but a message will be logged to the console.
   */
  readonly deleteChat: (id: string) => Promise<void>;

  /**
   * Submit a prompt from a `chat-panel`.
   *
   * This will create a new completion for the chat and stream the responses
   * to that particular completion id.
   */
  readonly submitChat: (options: Hrafnar.ChatSubmitOptions) => Promise<void>;
};


/**
 * Create the Chats slice for the store.
 */
export
const createChatsSlice:
  StateCreator<ChatsSlice & UISlice, [], [], ChatsSlice> = (set, get) => ({
  /*---------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------*/

  // Initial list of chats.
  chats: [],

  /*---------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------*/

  // Initialize the chats for the application.
  initializeChats: async () => {
    // Get the tasks from Hrafnar.
    const tasks = await Hrafnar.getTasks();

    // Filter the tasks for chats.
    const chats = tasks.filter(task => task.graph === 'chat');

    // Create the chat panel specs for the chats.
    const chatSpecs = chats.map<ChatPanelSpec>(chat => (
      { type: 'chat-panel', id: chat.id }
    ));

    // Combine the chat specs with the other specs.
    const panelSpecs = [...get().panelSpecs, ...chatSpecs];

    // Update the store.
    set({ chats, panelSpecs });
  },

  // Create a new chat.
  createChat: async () => {
    // Create the chat on Hrafnar.
    const chat = await Hrafnar.createChat();

    // Add the chat and the panel spec to the store.
    set(produce((draft: Draft<ChatsSlice & UISlice>) => {
      // Add the chat to the draft.
      draft.chats.push(castDraft(chat));

      // Create the panel for the chat.
      draft.panelSpecs.push({ type: 'chat-panel', id: chat.id });
    }));

    // Open the panel for the chat.
    get().openPanel(chat.id);
  },

  // Delete an existing chat.
  deleteChat: async (chatId: string) => {
    // Close the panel if it is open.
    get().closePanel(chatId);

    // Delete the chat on hrafnar
    await Hrafnar.deleteChat(chatId);

    // Update the store to remove the chat.
    set(produce((draft: Draft<ChatsSlice & UISlice>) => {
      // Delete the chat.
      draft.chats = draft.chats.filter(chat => chat.id !== chatId);

      // Delete the chat panel.
      draft.panelSpecs = draft.panelSpecs.filter(spec => spec.id !== chatId);
    }));
  },

  // Submit an existing chat for a new completion.
  submitChat: async (options: Hrafnar.ChatSubmitOptions) => {
    // Get the completion stream from Hrafanr.
    const stream = Hrafnar.submitChat(options);

    // Iterate the Hrafnar stream.
    for await (const run of stream) {
      set(produce((draft: Draft<ChatsSlice>) => {
        // Get the chat runs.
        const runs = draft.chats.find(chat => chat.id === options.id)!.runs;

        // Find the index of the most recent matching run.
        const i = runs.findLastIndex(r => r.id === run.id);

        // Update the existing run or push a new one.
        if (i !== -1) {
          runs[i] = castDraft(run);
        } else {
          runs.push(castDraft(run));
        }
      }));
    }

    // Fetch the updated chat from the store.
    const chat = get().chats.find(chat => chat.id === options.id)!;

    // If the chat is already named, there's nothing else to do.
    if (chat.display_name) {
      return;
    }

    // Set up the variable to hold the computed display name.
    let display_name = '';

    // Create a polling loop to fetch the computed display name.
    while (!display_name) {
      // Create a delay for 1s.
      const delay = new Promise(resolve => setTimeout(resolve, 1000));

      // Await the delay.
      await delay;

      // Fetch the task from Hrafnar.
      const task = await Hrafnar.getTask(options.id);

      // Extract the display name from the task.
      display_name = task.display_name;
    }

    // Update the chat with the computed display name.
    set(produce((draft: Draft<ChatsSlice>) => {
      // Fetch the chat object.
      const chat = draft.chats.find(chat => chat.id === options.id)!;

      // Set the chat display name.
      chat.display_name = display_name;
    }));
  }
});
