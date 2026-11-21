/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { ArrowUp, Hammer, Paperclip, Square, X } from 'lucide-react';

import type { FormEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';

import { useCallback, useRef, useState } from 'react';

import type * as api from '@/api';

import { Badge } from '@/components/ui/badge';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useAgents, useChatConfig, useHasPermissions } from '@/context';
import { notifyError } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { abortRun } from '@/queries';

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
      className="cursor-pointer hover:bg-accent"
      onClick={() => {
        removeFile(info.id);
      }}
    >
      {info.file.name}
      <X size={12} aria-hidden="true" />
    </Badge>
  ));

  // Create the attach file button.
  const attachButton = (
    <InputGroupButton
      aria-label="Attach File"
      disabled={isSubmitting || !!filePermissionTooltip}
      size="icon-sm"
      onClick={filePermissionTooltip ? undefined : triggerInput}
    >
      <Paperclip />
    </InputGroupButton>
  );

  // Create the tools toggle button.
  //
  // The toggle flips the `showTools` search param, which opens or closes the
  // tools panel (the agent identity and its tools) in the chat sidebar.
  // When the agent provides no tools, the toggle is disabled.
  const toolsLink = (
    <Link
      to="."
      search={(prev) => ({
        ...prev,
        // Opening the tools panel closes any open message detail so
        // the two never compete for the right sidebar slot.
        detailId: undefined,
        showTools: showTools ? undefined : true,
      })}
    />
  );

  const toolsButton = (
    <InputGroupButton
      render={hasTools ? toolsLink : undefined}
      aria-label="Toggle tools panel"
      title={hasTools ? 'Tools' : undefined}
      size="icon-sm"
      disabled={!hasTools}
      className={cn(
        'hover:no-underline',
        showTools && 'bg-accent text-accent-foreground',
      )}
    >
      <Hammer />
    </InputGroupButton>
  );

  // Create the control that shows why the tools toggle is disabled. Like the
  // attach button, the tooltip triggers on a wrapping span.
  const toolsToggle = hasTools ? (
    toolsButton
  ) : (
    <Tooltip>
      <TooltipTrigger render={<span />}>{toolsButton}</TooltipTrigger>
      <TooltipContent side="top">
        This agent does not provide any tools.
      </TooltipContent>
    </Tooltip>
  );

  // Create the control that shows why file attachment is disabled, since a
  // disabled button gets no pointer events of its own.
  const attachControl = filePermissionTooltip ? (
    <Tooltip>
      <TooltipTrigger render={<span />}>{attachButton}</TooltipTrigger>
      <TooltipContent side="top">{filePermissionTooltip}</TooltipContent>
    </Tooltip>
  ) : (
    attachButton
  );

  // Create the send button, which becomes Stop while a run is in flight.
  const sendButton = isSubmitting ? (
    <InputGroupButton
      aria-label="Stop"
      title="Stop"
      variant="default"
      size="icon-sm"
      onClick={handleStop}
      className="rounded-full"
    >
      <Square fill="currentColor" />
    </InputGroupButton>
  ) : (
    <InputGroupButton
      aria-label="Submit"
      variant="default"
      size="icon-sm"
      onClick={handleClick}
      className="rounded-full"
    >
      <ArrowUp />
    </InputGroupButton>
  );

  // Create the row of attached file badges, if any.
  const fileRow =
    files.length > 0 ? (
      <InputGroupAddon align="block-end" className="flex-wrap">
        {fileBadges}
      </InputGroupAddon>
    ) : null;

  // Return the rendered component.
  //
  // The upstream input group is restyled here to match the Nebari `Input`:
  // its fill, hover border, 2px focus ring, and motion tokens. Its dark-mode
  // fill is a `dark:` class, so only a `dark:` class can replace it.
  return (
    <div className="pb-6 bg-canvas mx-auto w-full min-w-3xs max-w-3xl sticky bottom-0">
      <input
        ref={inputRef}
        onChange={handleInputChange}
        className="hidden"
        type="file"
        multiple
        accept=".txt,.csv,.md"
      />
      <form ref={formRef} onSubmit={handleSubmit}>
        <InputGroup
          className={cn(
            'bg-background shadow-none hover:border-border-strong dark:bg-background',
            'transition-none motion-safe:transition-[color,background-color,border-color,box-shadow]',
            'motion-safe:duration-(--duration-fast) motion-safe:ease-(--ease-standard)',
            'has-[[data-slot=input-group-control]:focus-visible]:ring-2',
            'has-[[data-slot=input-group-control]:focus-visible]:ring-ring',
          )}
        >
          <InputGroupTextarea
            ref={textAreaRef}
            disabled={isSubmitting}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            aria-label="Message"
            className="field-sizing-content max-h-60 min-h-16 px-3 pt-3 disabled:bg-transparent"
          />
          {fileRow}
          <InputGroupAddon align="block-end" className="gap-1">
            {attachControl}
            {toolsToggle}
            <span className="grow" />
            {sendButton}
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}
