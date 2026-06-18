/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ArrowUp, Paperclip, X
} from 'lucide-react';

import type {
  FormEvent, KeyboardEvent, MouseEvent, ReactNode
} from 'react';

import {
  useCallback, useMemo, useRef, useState
} from 'react';

import * as api from "@/api";

import {
  Badge
} from "@/components/ui/badge";

import {
  Button
} from '@/components/ui/button';

import {
  useAppConfig, useChatConfig
} from '@/context';

import {
  cn
} from '@/lib/utils';

import {
  useOnSubmit
} from './hooks';


// The `accept` value used for agents that accept generic document uploads,
// and for agents that don't advertise any multimodal input capabilities.
const DOCUMENT_ACCEPT = ".txt,.csv,.md";


/**
 * A react component that renders the chat input box.
 */
export
function ChatInput(): ReactNode {
  // Define a type for holding file info.
  type FileInfo = {
    // A random unique id for the file.
    readonly id: string;

    // The actual file to upload.
    readonly file: File;
  };

  // Fetch the submit handler from the runtime.
  const onSubmit = useOnSubmit();

  // Fetch the app and chat config to resolve the selected agent.
  const { agents } = useAppConfig();
  const { agentId } = useChatConfig();

  // Resolve the file-upload behavior from the selected agent's advertised
  // AG-UI multimodal input capabilities (`@ag-ui/core` AgentCapabilities).
  const { uploadsAllowed, accept } = useMemo(() => {
    // Look up the selected agent's multimodal input capabilities.
    const input = agents.find((agent) => agent.id === agentId)
      ?.capabilities?.multimodal?.input;

    // If the agent didn't advertise any input modalities, preserve the
    // historical behavior: allow document uploads.
    if (input === undefined) {
      return { uploadsAllowed: true, accept: DOCUMENT_ACCEPT };
    }

    // Otherwise build the `accept` value from the enabled modalities.
    const accepts: string[] = [];
    if (input.image) { accepts.push("image/*"); }
    if (input.audio) { accepts.push("audio/*"); }
    if (input.video) { accepts.push("video/*"); }
    if (input.file) { accepts.push(DOCUMENT_ACCEPT); }

    // Uploads are allowed only if at least one modality is enabled.
    return { uploadsAllowed: accepts.length > 0, accept: accepts.join(",") };
  }, [agents, agentId]);

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
  const handleSubmit = useCallback(async (event: FormEvent) => {
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
          // Derive the content discriminator from the file's MIME type so
          // images, audio, and video are labeled as the correct modality,
          // falling back to "document" for everything else.
          const type = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("audio/")
              ? "audio"
              : file.type.startsWith("video/")
                ? "video"
                : "document";
          return {
            type,
            source: {
              type: "data",
              mimeType: file.type,
              value: (await file.bytes()).toBase64(),
            },
            metadata: { name: file.name },
          };
        }),
      );

      // Submit the prompt for processing.
      await onSubmit({ prompt, files: fics });
    } finally {
      // Clear the submitting flag.
      setIsSubmitting(false);
    }
  }, [onSubmit, files]);

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
    input.value = "";

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
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:bg-sidebar"
      onClick={() => {
        removeFile(info.id);
      }}
    >
      {info.file.name}
      <X size={12} />
    </Badge>
  ));

  // Return the rendered component.
  return (
    <div className={ cn(
        'pb-6 bg-white mx-auto w-full min-w-3xs max-w-3xl sticky bottom-0' ) }>
      <form
        ref={ formRef }
        onSubmit={ handleSubmit }
        className={ cn(
          'p-4 flex flex-col gap-6 rounded-md border shadow-sm',
          'has-[textarea:focus-visible]:border-bd-brand-default' ) }>
        <textarea
          ref={ textAreaRef }
          disabled={ isSubmitting }
          onKeyDown={ handleKeyDown }
          placeholder='Send a message...'
          className='outline-none resize-none field-sizing-content w-full' />
        <div className='flex flex-row gap-2'>
          {uploadsAllowed && (
            <Button
              aria-label='Attach File'
              disabled={ isSubmitting }
              variant="ghost"
              className="font-light"
              onClick={triggerInput}>
            <input
              ref={inputRef}
              onChange={handleInputChange}
              className="hidden"
              type="file"
              multiple
              accept={accept} />
              <Paperclip />
            </Button>
          )}
          <div className="grow flex flex-row flex-wrap gap-2 items-center">
            {fileBadges}
          </div>
          <Button
            aria-label='Submit'
            disabled={ isSubmitting }
            onClick={ handleClick }
            className={ cn(
              'rounded-full size-8 bg-bd-brand-default',
              'hover:bg-bd-brand-default/90 hover:cursor-pointer' ) }>
            <ArrowUp />
          </Button>
        </div>
      </form>
    </div>
  );
}
