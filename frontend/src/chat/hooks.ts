/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type * as agui from '@ag-ui/core';

import { useMutation, useMutationState } from '@tanstack/react-query';

import { useNavigate } from '@tanstack/react-router';

import { useCallback } from 'react';

import * as api from '@/api';

import { useChatConfig, useHasPermissions } from '@/context';

import { createRunMutation, createThreadMutation } from '@/queries';

import { enabledFrontendToolDefinitions } from './tools';

/**
 * A hook for submitting a user prompt.
 *
 * This hooks handles the combined logic of creating the thread if needed,
 * switching to the new thread, creating the user message, then creating
 * the new run.
 *
 * @returns A function for submitting the user prompt.
 *
 * #### Notes
 * - If the current `threadId` in the chat config is `undefined`, this
 *   function will first create a new thread using the current agent id,
 *   then switch the URL to that new thread id, then submit the user prompt
 *   as the first run.
 *
 * - If the `threadId` in the chat config exists, this function will submit
 *   the prompt as a new run for that thread.
 */
export function useOnSubmit() {
  // Extract the chat config.
  const { thread, agentId } = useChatConfig();

  // Check file-related permissions.
  const canAttachFiles = useHasPermissions(['files:read', 'files:write']);

  // Fetch the route navigator.
  const navigate = useNavigate();

  // Fetch the create thread mutation.
  const { mutateAsync: createThread } = useMutation(createThreadMutation);

  // Fetch the create run mutation.
  const { mutateAsync: createRun } = useMutation(createRunMutation);

  // Create the callback function for handling the submit.
  const onSubmitPrompt = useCallback(
    async (options: useOnSubmit.CallbackOptions) => {
      // Extract the options.
      const { prompt, files } = options;

      // Throw if the agent id is somehow undefined.
      //
      // This should not happen if the router search param validation is
      // operating properly.
      if (agentId === undefined) {
        throw new Error('`agentId` is `undefined`');
      }

      // Upload any attached files to ravnar, if permissions allow.
      const ravnarFiles = canAttachFiles
        ? await Promise.all((files ?? []).map(api.uploadFile))
        : [];

      // Determine the thread id for submission, creating one if needed.
      const tid =
        thread?.id ||
        (await (async () => {
          // Pick a reasonable name for the thread.
          const name = prompt.slice(0, 60);

          // Create a new thread with the user's selected agent.
          const thread = await createThread({ agentId, name });

          // Navigate to the new thread id, preserving the other search
          // params (e.g. the open tools panel) and clearing the stale
          // detail id, which referred to the prior context.
          navigate({
            to: '.',
            search: (prev) => ({
              ...prev,
              threadId: thread.id,
              detailId: undefined,
            }),
          });

          // Return the new thread id.
          return thread.id;
        })());

      // Create the user message for the prompt.
      const msg: agui.UserMessage = {
        role: 'user',
        id: crypto.randomUUID(),
        content: [{ type: 'text', text: prompt }, ...ravnarFiles],
      };

      // Create the run for the thread.
      await createRun({
        threadId: tid,
        messages: [msg],
        tools: enabledFrontendToolDefinitions(),
        context: [], // TODO support client-side context.
      });
    },
    [agentId, thread, createThread, createRun, canAttachFiles],
  );

  // Return the submit callback.
  return onSubmitPrompt;
}

/**
 * A hook for determining whether a thread has an in-flight run.
 *
 * A run is in-flight while the `createRunMutation` is pending, which spans
 * from message submit until the response stream completes.
 *
 * @param threadId - The id of the thread to check, if any.
 *
 * @returns `true` if the given thread currently has a pending run.
 */
export function useIsRunning(threadId: string | undefined): boolean {
  // Collect the thread ids of all currently pending runs.
  const pendingThreadIds = useMutationState({
    filters: { mutationKey: ['thread', 'run'], status: 'pending' },
    select: (mutation) => {
      const variables = mutation.state.variables as
        | api.createRun.Options
        | undefined;
      return variables?.threadId;
    },
  });

  // The thread is running if its id is among the pending runs.
  return threadId !== undefined && pendingThreadIds.includes(threadId);
}

/**
 * The namespace for the `useOnSubmit` statics.
 */
export namespace useOnSubmit {
  /**
   * A type alias for the `useOnSubmit` callback options.
   */
  export type CallbackOptions = {
    /**
     * The prompt for the submission.
     */
    readonly prompt: string;

    /**
     * The file input content to attach to the submission.
     */
    readonly files?: readonly api.FileInputContent[];
  };
}
