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

import { useDelayedFlag, useIsRunning } from './hooks';

import { MessageRendererMemo } from './messagerenderer';

import { activityProgressLabel, runningToolName } from './progress';

import { usePendingApprovals } from './tools';

import { WaitingSpinner } from './waitingspinner';

/**
 * How long a run must be in flight, in milliseconds, before the reassuring
 * "still working" message is shown.
 */
const SLOW_RUN_DELAY_MS = 20_000;

/**
 * The message shown once a run has been in flight past {@link SLOW_RUN_DELAY_MS}.
 */
const SLOW_RUN_MESSAGE =
  'This is taking longer than usual — still working, hang tight…';

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

  // After a run has been in flight for a while, surface a reassuring message
  // so a long wait reads as ongoing work rather than a freeze.
  const isSlow = useDelayedFlag(isRunning, SLOW_RUN_DELAY_MS);

  // Fetch any human-in-the-loop approval requests for this thread awaiting a
  // decision.
  const approvals = usePendingApprovals(thread?.id);

  // Create the content for the thread.
  const content = (messages ?? []).map((msg) => (
    <MessageRendererMemo key={msg.id} message={msg} />
  ));

  // Show a progress indicator for the whole time a run is in flight, so there
  // is always clear feedback and never just a lone Stop button. A pending
  // approval means the run is paused on the user, not the model, so the
  // approval card stands in for the indicator.
  const showSpinner = isRunning && approvals.length === 0;

  // Choose the most specific progress label available, so a long step reads
  // as concrete work rather than a freeze:
  //   1. a building activity (e.g. a map plotting its points),
  //   2. a currently-running tool call,
  //   3. once the run has been slow, a reassuring "still working" message,
  //   4. otherwise, once the assistant has started answering, a neutral
  //      "Working…" so a mid-answer pause still shows progress.
  // When none apply (the initial thinking phase) the label is left undefined
  // so the spinner falls back to its rotating messages.
  const last = messages?.at(-1);
  const assistantSpeaking =
    last?.role === 'assistant' && !!last.content?.trim();
  const runningTool = runningToolName(messages);
  const spinnerLabel =
    activityProgressLabel(messages) ??
    (runningTool ? `Running ${runningTool}…` : undefined) ??
    (isSlow ? SLOW_RUN_MESSAGE : undefined) ??
    (assistantSpeaking ? 'Working…' : undefined);
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
