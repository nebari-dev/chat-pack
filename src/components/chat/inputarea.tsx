/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  FormEvent, KeyboardEvent, MouseEvent, ReactNode
} from 'react';

import {
  memo, useCallback, useRef, useState
} from 'react';

import * as Hrafnar from '@/hrafnar';

import {
  useAppStore
} from '@/store';

import {
  TextArea
} from './textarea';

import {
  ToolBar
} from './toolbar';

import './inputarea.css';


/**
 * A React component which renders the chat input area.
 *
 * #### Notes
 * This component assumes that `chatId` exists in the store.
 */
export
function InputArea(props: InputArea.Props): ReactNode {
  // Extract the props.
  const { chatId } = props;

  // Fetch all the models from the store.
  const allModels = useAppStore(store => store.models);

  // Fetch the most recently selected model from the store.
  const recentModel = useAppStore(store => {
    // Fetch the chat.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Fetch the most recent run.
    const run = chat.runs[chat.runs.length - 1];

    // Fetch the model name of the most recent run.
    const modelName = run?.model;

    // Map the most recent model name to a full model object.
    return store.models.find(m => m.name === modelName) ?? null;
  });

  // Get the `submitChat` function from the store.
  const submitChat = useAppStore(store => store.submitChat);

  // Set up the ref to track the `form` node.
  const formRef = useRef<HTMLFormElement>(null);

  // Set up the ref to track the `textarea` node.
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Set up the state to track the selected model.
  const [selectedModel, setSelectedModel] =
    useState<Hrafnar.Model | null>(null);

  // Set up the state to track the selected files.
  const [selectedFiles, setSelectedFiles] =
    useState<readonly Hrafnar.FileInfo[]>([]);

  // Calculate the model to display in the model selector.
  const model = selectedModel ?? recentModel ?? allModels[0];;

  // The handler for submitting a request from the `UserTextInput`.
  const handleSubmit = (event: FormEvent) => {
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

    // Convert the files into file ids.
    const fileIds = selectedFiles.map(f => f.id);

    // Submit the chat for completion.
    submitChat({
      id: chatId,
      model: model?.name ?? '',
      prompt,
      files: fileIds,
      tools: []
    });
  };

  // Set up the event handler for the text area keyboard events.
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Stop the event when submitting a chat request.
      event.stopPropagation();
      event.preventDefault();

      // Emit the `submit` event for the form.
      formRef.current!.requestSubmit();
    }
  }, []);

  // Setup the click handler for the submit button.
  const handleClick = useCallback((event: MouseEvent) => {
    // Stop the event when submitting a chat request.
    event.stopPropagation();
    event.preventDefault();

    // Emit the `submit` event for the form.
    formRef.current!.requestSubmit();
  }, []);

  // Return the rendered component.
  return (
    <form
      id={ `form-${chatId}` }
      ref={ formRef }
      className='chat-InputArea'
      onSubmit={ handleSubmit }>
      <TextArea
        chatId={ chatId }
        ref={ textAreaRef }
        onKeyDown={ handleKeyDown } />
      <ToolBar
        selectedFiles={ selectedFiles }
        setSelectedFiles={ setSelectedFiles }
        model={ model }
        setModel={ setSelectedModel }
        onSubmit={ handleClick } />
    </form>
  );
}


/**
 * A memoized version of `InputArea`.
 */
export
const InputAreaMemo = memo(InputArea);


/**
 * The namespace for the `InputArea` component statics.
 */
export
namespace InputArea {
  /**
   * A type alias for the `InputArea` props.
   */
  export
  type Props = {
    /**
     * The chat id associated with the input area.
     */
    readonly chatId: string;
  };
}
