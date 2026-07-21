/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AlertCircle, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { useChatConfig } from '@/context';

import {
  abortRun,
  threadErrorQuery,
  threadMessagesQuery,
  threadStalledQuery,
} from '@/queries';

import { ApprovalPrompts } from './approvalprompts';

import { useIsRunning } from './hooks';

import { MessageRendererMemo } from './messagerenderer';

import { runningToolName } from './progress';

import { usePendingApprovals } from './tools';

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

  // Fetch the stalled state for the thread's in-flight run, if any.
  const { data: stalled } = useQuery(threadStalledQuery(thread?.id));

  // Determine whether the thread is waiting on an LLM response.
  const isRunning = useIsRunning(thread?.id);

  // Fetch any human-in-the-loop approval requests for this thread awaiting a
  // decision.
  const approvals = usePendingApprovals(thread?.id);

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
  // A pending approval means the run is paused on the user, not the model, so
  // the approval card stands in for the spinner.
  const showSpinner = isRunning && !assistantSpeaking && approvals.length === 0;
  // Surface the currently-running tool (if any) as concrete progress, so a
  // slow tool call reads as work-in-progress rather than a freeze.
  const runningTool = runningToolName(messages);
  const spinnerLabel = runningTool ? `Running ${runningTool}…` : undefined;
  const spinner = showSpinner ? (
    <div className="mt-4">
      <WaitingSpinner label={spinnerLabel} />
    </div>
  ) : null;

  // Render a non-fatal notice when the run's event stream has stalled. The
  // run is not cancelled automatically; the user can keep waiting or stop it.
  const stalledNotice =
    isRunning && stalled && thread ? (
      <div className="mt-4 flex flex-row items-start gap-2 text-muted-foreground">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span className="grow text-sm">
          This is taking longer than expected — the connection may have stalled.
          You can keep waiting or stop the run.
        </span>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            abortRun(thread.id);
          }}
        >
          Stop
        </Button>
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
      {stalledNotice}
      <ApprovalPrompts threadId={thread?.id} />
      {inlineError}
    </div>
  );
}
