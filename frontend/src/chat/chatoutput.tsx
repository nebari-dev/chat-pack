/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AlertCircle, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { useChatConfig } from '@/context';

import { threadErrorQuery, threadMessagesQuery } from '@/queries';

import { useIsRunning } from './hooks';

import { MessageRendererMemo } from './messagerenderer';

import { WaitingSpinner } from './waitingspinner';

/**
 * A react component that renders the chat output for the session.
 */
export function ChatOutput(): ReactNode {
  // Fetch the current thread from the chat config.
  const { thread } = useChatConfig();

  // Fetch the query client for dismissing the inline error.
  const client = useQueryClient();

  // Create the query for the thread messages.
  const query = threadMessagesQuery(thread?.id);

  // Fetch the thread messages for the chat.
  const { data: messages } = useQuery(query);

  // Fetch the inline error state for the thread, if any.
  const { data: error } = useQuery(threadErrorQuery(thread?.id));

  // Determine whether the thread is waiting on an LLM response.
  const isRunning = useIsRunning(thread?.id);

  // Create the content for the thread.
  const content = (messages ?? []).map((msg) => (
    <MessageRendererMemo key={msg.id} message={msg} />
  ));

  // Show the waiting spinner whenever the run is in-flight and the model is
  // not actively speaking. The only state that should replace the spinner is
  // an assistant message with text content, which streams as its own
  // indicator. Every other state — the user's prompt, a reasoning step, a
  // running tool call, or an activity — means the model is still working
  // toward its answer, so the spinner stays up to show progress.
  const last = messages?.at(-1);
  const assistantSpeaking =
    last?.role === 'assistant' && !!last.content?.trim();
  const showSpinner = isRunning && !assistantSpeaking;
  const spinner = showSpinner ? (
    <div className="mt-4">
      <WaitingSpinner />
    </div>
  ) : null;

  // Render the inline error when the latest run failed to send.
  const inlineError =
    error && thread ? (
      <div className="mt-4 flex flex-row items-start gap-2 text-destructive">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span className="grow text-sm">{error}</span>
        <button
          aria-label="Dismiss error"
          className="shrink-0 cursor-pointer opacity-70 hover:opacity-100"
          onClick={() => {
            client.setQueryData(['thread', 'error', thread.id], null);
          }}
        >
          <X size={16} />
        </button>
      </div>
    ) : null;

  // Return the rendered component.
  return (
    <div className="grow mx-auto w-full min-w-3xs max-w-3xl">
      {content}
      {spinner}
      {inlineError}
    </div>
  );
}
