/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { ArrowUp, Paperclip, Square, Wrench, X } from 'lucide-react';

import type { FormEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useCallback, useRef, useState } from 'react';

import type * as api from '@/api';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAgents, useChatConfig, useHasPermissions } from '@/context';
import { notifyError } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { abortRun } from '@/queries';

import { AgentPicker } from './agentpicker';
import { useOnSubmit } from './hooks';

import { FRONTEND_TOOLS } from './tools';

/**
 * A react component that renders the chat input box.
 */
export function ChatInput(): ReactNode {
  // Define a type for holding file info.
  type FileInfo = {
    // A random unique id for the file.
    readonly id: string;

    // The actual file to upload.
    readonly file: File;
  };

  // Fetch the agents and the current tools panel state from the chat config.
  const agents = useAgents();
  const { showTools, agentId, thread } = useChatConfig();

  // Resolve the current agent and determine whether any tools are available.
  //
  // The tools panel is available when either the agent provides backend tools
  // or there are client-executed frontend tools to toggle, so an agent with no
  // backend tools still exposes the available frontend tools.
  const agent = agents.find((a) => a.id === agentId);
  const hasAgentTools = (agent?.capabilities?.tools?.items?.length ?? 0) > 0;
  const hasTools = hasAgentTools || FRONTEND_TOOLS.length > 0;

  // Check file-related permissions.
  const canAttachFiles = useHasPermissions(['files:read', 'files:write']);

  // Build the tooltip message for disabled file attachment.
  const filePermissionTooltip = !canAttachFiles
    ? 'Attaching files requires `files:read` and `files:write` permissions. Contact an administrator.'
    : undefined;

  // Fetch the submit handler from the runtime.
  const onSubmit = useOnSubmit();

  // Create the ref for the form element.
  const formRef = useRef<HTMLFormElement>(null);

  // Create the ref for the text area element.
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Create the ref for the hidden input element.
  const inputRef = useRef<HTMLInputElement>(null);

  // Create the state to hold the files to upload.
  const [files, setFiles] = useState<readonly FileInfo[]>([]);

  // Create the state to track the submitting state.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create the handler for the form submit.
  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      // Stop the event when submitting a chat request.
      event.stopPropagation();
      event.preventDefault();

      // Fetch the current `textarea` node.
      const textarea = textAreaRef.current!;

      // Fetch the current prompt value of the text area.
      const prompt = textarea.value;

      // Clear the text area's value before submitting the request.
      textarea.value = '';

      // Do nothing for an empty prompt.
      //
      // Keep the current file attachment state. The user must have a
      // non-empty text prompt before we can submit for processing.
      if (!prompt) {
        return;
      }

      // Create shallow clone of the input files.
      const inputFiles = [...files];

      // If there were attached files, reset them before submission.
      if (files.length > 0) {
        setFiles([]);
      }

      // Execute the prompt submission pipeline.
      try {
        // Set the submitting flag to disable the input UI.
        setIsSubmitting(true);

        // Convert the attached files into file input content.
        //
        // FIXME - I'm only mildly okay with this. It works, but is not
        // well-factored. Could be better...
        const fics: readonly api.FileInputContent[] = await Promise.all(
          inputFiles.map(async ({ file }) => {
            return {
              type: 'document',
              source: {
                type: 'data',
                mimeType: file.type,
                value: (await file.bytes()).toBase64(),
              },
              metadata: { name: file.name },
            };
          }),
        );

        // Submit the prompt for processing.
        await onSubmit({ prompt, files: fics });
      } catch (error) {
        // Surface the failure. Mutation errors are already toasted by the
        // global handler; `notifyError` de-duplicates by category, so this
        // covers non-mutation paths (e.g. file reads) without double toasts.
        notifyError(error);
      } finally {
        // Clear the submitting flag.
        setIsSubmitting(false);
      }
    },
    [onSubmit, files],
  );

  // Create the handler for the keydown event.
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Stop the event when submitting a chat request.
      event.stopPropagation();
      event.preventDefault();

      // Emit the `submit` event for the form.
      formRef.current!.requestSubmit();
    }
  }, []);

  // Create the click handler for the submit button.
  const handleClick = useCallback((event: MouseEvent) => {
    // Stop the event when submitting a chat request.
    event.stopPropagation();
    event.preventDefault();

    // Emit the `submit` event for the form.
    formRef.current!.requestSubmit();
  }, []);

  // Create the click handler for the stop button.
  //
  // Cancelling aborts the in-flight run's event stream. The submit pipeline's
  // `finally` then clears `isSubmitting`, re-enabling the composer.
  const handleStop = useCallback(
    (event: MouseEvent) => {
      // Do not let the click submit the form.
      event.stopPropagation();
      event.preventDefault();

      // Abort the in-flight run for the current thread, if any.
      if (thread) {
        abortRun(thread.id);
      }
    },
    [thread],
  );

  // Create the callback for triggering the hidden input element.
  const triggerInput = useCallback(() => {
    inputRef.current!.click();
  }, []);

  // Create the callback to handle the input change event.
  const handleInputChange = useCallback(() => {
    // Fetch the input node.
    const input = inputRef.current!;

    // Fetch the input files and create the file info objects.
    const files = Array.from(input.files ?? []).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));

    // Reset the input to empty for the next use.
    input.value = '';

    // Add the new files to the existing files.
    setFiles((prev) => [...prev, ...files]);
  }, []);

  // Create the callback to remove an attached file.
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((info) => info.id !== id));
  }, []);

  // Render the badges for the attached files.
  const fileBadges = files.map((info) => (
    <Badge
      key={info.id}
      variant="outline"
      render={<button type="button" />}
      aria-label={`Remove ${info.file.name}`}
      className="cursor-pointer gap-1 font-mono hover:bg-accent"
      onClick={() => {
        removeFile(info.id);
      }}
    >
      {info.file.name}
      <X className="size-3" aria-hidden="true" />
    </Badge>
  ));

  // Create the attach button.
  const attachButton = (
    <Button
      aria-label="Attach file"
      disabled={isSubmitting || !!filePermissionTooltip}
      variant="ghost"
      size="icon-sm"
      onClick={filePermissionTooltip ? undefined : triggerInput}
    >
      <Paperclip />
    </Button>
  );

  // The link that flips the tools panel. Opening it closes any open message
  // detail so the two never compete for the right side of the chat.
  const toolsLink = (
    <Link
      to="."
      search={(prev) => ({
        ...prev,
        detailId: undefined,
        showTools: showTools ? undefined : true,
      })}
    />
  );

  // The tools toggle shows how many tools the agent and client provide.
  const toolCount =
    (agent?.capabilities?.tools?.items?.length ?? 0) + FRONTEND_TOOLS.length;
  const toolsButton = (
    <Button
      render={hasTools ? toolsLink : undefined}
      aria-label={
        hasTools
          ? `${showTools ? 'Hide' : 'Show'} tools (${toolCount})`
          : 'No tools available'
      }
      variant="ghost"
      size="sm"
      disabled={!hasTools}
      className={cn(
        'hover:no-underline',
        showTools && 'bg-accent text-accent-foreground',
      )}
    >
      <Wrench />
      {hasTools ? <span className="tabular-nums">{toolCount}</span> : null}
    </Button>
  );

  // Show the reason a control is disabled, since disabled buttons get no
  // pointer events of their own.
  const attachControl = filePermissionTooltip ? (
    <Tooltip>
      <TooltipTrigger render={<span />}>{attachButton}</TooltipTrigger>
      <TooltipContent side="top">{filePermissionTooltip}</TooltipContent>
    </Tooltip>
  ) : (
    attachButton
  );

  // Send becomes Stop while a run is in flight.
  const sendButton = isSubmitting ? (
    <Button
      type="button"
      aria-label="Stop"
      title="Stop"
      variant="outline"
      size="icon"
      onClick={handleStop}
      className="rounded-full"
    >
      <Square fill="currentColor" className="size-3" />
    </Button>
  ) : (
    <Button
      aria-label="Send"
      title="Send"
      size="icon"
      onClick={handleClick}
      className="rounded-full"
    >
      <ArrowUp />
    </Button>
  );

  const agentName = agent?.capabilities.identity?.name || agentId;
  const placeholder = thread
    ? `Reply to ${agentName}…`
    : `Message ${agentName}…`;

  // Return the rendered component.
  return (
    <div className="sticky bottom-0 mx-auto w-full min-w-3xs max-w-(--thread-max-width) bg-canvas pb-4">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cn(
          'flex flex-col rounded-xl border border-input bg-card shadow-xs',
          'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-(--duration-fast)',
          'has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-ring/25',
        )}
      >
        <textarea
          ref={textAreaRef}
          disabled={isSubmitting}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Message"
          rows={2}
          className="field-sizing-content max-h-60 min-h-12 w-full resize-none bg-transparent px-4 pt-3.5 pb-1.5 outline-none placeholder:text-muted-foreground"
        />
        {fileBadges.length > 0 ? (
          <div className="flex flex-row flex-wrap gap-1.5 px-3 pb-1">
            {fileBadges}
          </div>
        ) : null}
        <div className="flex flex-row items-center gap-1 px-2 pt-1 pb-2">
          <input
            ref={inputRef}
            onChange={handleInputChange}
            className="hidden"
            type="file"
            multiple
            accept=".txt,.csv,.md"
          />
          <AgentPicker />
          {attachControl}
          {toolsButton}
          <span className="grow" />
          {sendButton}
        </div>
      </form>
      <p className="mt-2 text-center text-muted-foreground text-xs">
        <kbd className="font-mono">Enter</kbd> to send ·{' '}
        <kbd className="font-mono">Shift</kbd>+
        <kbd className="font-mono">Enter</kbd> for a new line
      </p>
    </div>
  );
}
