/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  ArrowUp, Paperclip
} from 'lucide-react';

import type {
  FormEvent, KeyboardEvent, MouseEvent, ReactNode
} from 'react';

import {
  useCallback, useRef, useState
} from 'react';

import {
  Button
} from '@/components/ui/button';

import {
  cn
} from '@/lib/utils';

import {
  useSubmitPrompt
} from './hooks';


/**
 * A react component that renders the chat input box.
 */
export
function ChatInput(): ReactNode {
  // Fetch the submit handler from the runtime.
  const submitPrompt = useSubmitPrompt();

  // Create the disabled state.
  const [isDisabled, setIsDisabled] = useState(false);

  // Create the ref for the form element.
  const formRef = useRef<HTMLFormElement>(null);

  // Create the ref for the text area element.
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
    if (!prompt) {
      return;
    }

    // Submit the user the prompt.
    try {
      setIsDisabled(true);
      await submitPrompt(prompt);
    } finally {
      setIsDisabled(false);
    }
  }, [submitPrompt]);

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
          disabled={ isDisabled }
          onKeyDown={ handleKeyDown }
          placeholder='Send a message...'
          className='outline-none resize-none field-sizing-content w-full' />
        <div className='flex justify-between'>
          <Button
            aria-label='Attach'
            disabled={ isDisabled }
            className={ cn(
              'rounded-full size-8 bg-bg-neutral-default',
              'text-text-neutral-default hover:bg-bg-neutral-dark',
              'hover:cursor-pointer' ) }>
            <Paperclip />
          </Button>
          <Button
            aria-label='Submit'
            disabled={ isDisabled }
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
