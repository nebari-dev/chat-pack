/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import {
  useMutation
} from '@tanstack/react-query';

import {
  useNavigate
} from '@tanstack/react-router';

import {
  useCallback
} from 'react';

import {
  useChatConfig
} from '@/context';

import {
  createRunMutation, createThreadMutation
} from '@/queries';


/**
 * A type alias for a chat prompt submit function.
 */
export
type SubmitPromptFunc = (prompt: string) => Promise<void>;


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
export
function useSubmitPrompt(): SubmitPromptFunc {
  // Extract the chat config.
  const { thread, agentId } = useChatConfig();

  // Fetch the route navigator.
  const navigate = useNavigate();

  // Fetch the create thread mutation.
  const { mutateAsync: createThread } = useMutation(createThreadMutation);

  // Fetch the create run mutation.
  const { mutateAsync: createRun } = useMutation(createRunMutation);

  // Create the callback function for handling the submit.
  const onSubmitPrompt = useCallback(async (prompt: string) => {
    // Determine the thread id for submission, creating one if needed.
    const tid = (
      thread?.id ||
      await (async () => {
        // Pick a reasonable name for the thread.
        const name = prompt.slice(0, 60);

        // Create a new thread with the user's selected agent.
        const thread = await createThread({ agentId, name });

        // Navigate to the new thread id.
        navigate({ to: '.', search: { threadId: thread.id } });

        // Return the new thread id.
        return thread.id;
      })()
    );

    // Create the user message for the prompt.
    const msg: agui.UserMessage = {
      role: 'user',
      id: crypto.randomUUID(),
      content: prompt
    };

    // Create the run for the thread.
    await createRun({
      threadId: tid,
      messages: [msg],
      tools: [],  // TODO support client-side tools.
      context: [] // TODO support client-side context.
    });
  }, [agentId, thread, createThread, createRun]);

  // Return the submit callback.
  return onSubmitPrompt;
}
