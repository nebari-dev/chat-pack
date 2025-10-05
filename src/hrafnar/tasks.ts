/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  applyOperation
} from 'fast-json-patch';

import {
  SSEParserStream
} from 'otui/utils';


/**
 * A type alias for a Hrafnar `TextPart`.
 */
export
type TextPart = {
  /**
   * The discriminated type of the part.
   */
  readonly kind: 'text';

  /**
   * The data payload for the part.
   */
  readonly data: { readonly content_parts: readonly string[]; };
};


/**
 * A type alias for a Hrafnar `FilePart`.
 */
export
type FilePart = {
  /**
   * The discriminated type of the part.
   */
  readonly kind: 'file';

  /**
   * The data payload for the part.
   */
  readonly data: { readonly file_id: string; };
};


/**
 * A type alias for a Hrafnar `ToolCallInputPart`.
 */
export
type ToolCallInputPart = {
  /**
   * The discriminated type of the part.
   */
  readonly kind: 'tool-call-input';

  /**
   * The JSON data specific to this tool call input.
   */
  readonly data: any;
};


/**
 * A type alias for a Hrafnar `ToolCallOutputPart`.
 */
export
type ToolCallOutputPart = {
  /**
   * The discriminated type of the part.
   */
  readonly kind: 'tool-call-output';

  /**
   * The JSON data specific to this tool call output.
   */
  readonly data: any;
};


/**
 * A type alias for a Hrafnar `ToolCallPart`.
 */
export
type ToolCallPart = ToolCallInputPart | ToolCallOutputPart;


/**
 * A type alias for a Hrafnar `MessageStep`.
 */
export
type MessageStep = {
  /**
   * The discriminated type of the step.
   */
  readonly kind: 'message',

  /**
   * The unique id for the step.
   */
  readonly id: string;

  /**
   * The text parts for the step.
   */
  readonly parts: readonly TextPart[];
};


/**
 * A type alias for a Hrafnar `ToolCallStep`.
 */
export
type ToolCallStep = {
  /**
   * The discriminated type of the step.
   */
  readonly kind: 'tool-call';

  /**
   * The unique id for the step.
   */
  readonly id: string;

  /**
   * The data payload for the step.
   */
  readonly data: { readonly tool: string };

  /**
   * The tool call parts for the step.
   */
  readonly parts: readonly ToolCallPart[];
};


/**
 * A type alias for a Hrafnar `RequestPart`.
 */
export
type RequestPart = TextPart | FilePart;


/**
 * A type alias for a Hrafnar `ResponseStep`.
 */
export
type ResponseStep = MessageStep | ToolCallStep;


/**
 * A type alias for a Hrafnar `Request`.
 */
export
type Request = {
  /**
   * The unique id of the request.
   */
  readonly id: string;

  /**
   * The parts for the request echo.
   */
  readonly parts: readonly RequestPart[];
};


/**
 * A type alias for a Hrafnar `Run`.
 */
export
type Run = {
  /**
   * The unique ID of the run.
   */
  readonly id: string;

  /**
   * The model used for the run.
   */
  readonly model: string;

  /**
   * The request that triggered the run.
   */
  readonly request: Request;

  /**
   * The response steps for the run.
   */
  readonly response: readonly ResponseStep[];
};


/**
 * A type alias for a Hrafnar `Task`.
 */
export
type ChatTask = {
  /**
   * The unique ID of the task.
   */
  readonly id: string;

  /**
   * The timestamp for when the chat was created.
   */
  readonly timestamp: string;

  /**
   * The graph type for the task.
   */
  readonly graph: 'chat';

  /**
   * The display name for the task.
   */
  readonly display_name: string;

  /**
   * The runs for the task.
   */
  readonly runs: readonly Run[];
};


/**
 * A type alias for the supported tasks.
 */
export
type Task = ChatTask;


/**
 * A type alias for the chat submit options.
 */
export
type ChatSubmitOptions = {
  /**
   * The unique id of the chat.
   */
  readonly id: string;

  /**
   * The model name to use for the completion.
   */
  readonly model: string;

  /**
   * The user-provided prompt.
   */
  readonly prompt: string;

  /**
   * The unique ids of the files to include in context.
   */
  readonly files: readonly string[];

  /**
   * The names of the tools to make available to the model.
   */
  readonly tools: readonly string[];
};


/**
 * A type alias for a stream event that updates the run.
 */
export
type RunUpdate = {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'run-update';

  /**
   * The updated run object.
   */
  readonly run: Run;
};


/**
 * A type alias for a stream event that renames a task.
 */
export
type TaskRename = {
  /**
   * The discriminated type of the event.
   */
  readonly type: 'task-rename';

  /**
   * The new name for the task.
   */
  readonly name: string;
};


/**
 * A type union of the support stream event types.
 */
export
type StreamEvent = RunUpdate | TaskRename;


/**
 * Load the existing tasks from Hrafnar.
 *
 * @returns An array of the tasks stored on the server.
 */
export
async function getTasks(): Promise<readonly Task[]> {
  // Create the tasks from the server.
  const response = await fetch('/api/tasks', {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: null
  });

  // Throw an error if the request failed.
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Convert the tasks to a JSON array.
  return await response.json() as readonly Task[];
}


/**
 * Load an existing task from Hrafnar.
 *
 * @param id - The unique id of the task.
 *
 * @returns The requested task object.
 */
export
async function getTask(id: string): Promise<Task> {
  // Create the tasks from the server.
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: null
  });

  // Throw an error if the request failed.
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Convert the tasks to a JSON array.
  return await response.json() as Task;
}


/**
 * Create a new empty chat on Hrafnar.
 *
 * @returns A new empty chat task.
 */
export
async function createChat(): Promise<ChatTask> {
  // Create a new chat on the server.
  const response = await fetch('/api/tasks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph: 'chat' })
  });

  // Throw an error if the request failed.
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Convert the response to json.
  return await response.json() as ChatTask;
}


/**
 * Delete a chat on Hrafnar.
 *
 * @param id - The unique id for the chat.
 */
export
async function deleteChat(id: string): Promise<void> {
  // Delete the chat on the server.
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: null
  });

  // Throw an error if the request failed.
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
}


/**
 * Submit a chat completion to Hrafnar.
 *
 * @param options - The options for the chat submission.
 *
 * @returns An async generator which yields the patched/updated `Run`.
 */
export
async function* submitChat(options: ChatSubmitOptions): AsyncGenerator<StreamEvent> {
  // Extract the options.
  const { id, model, prompt, files, tools } = options;

  // Start the completion on the server.
  const response = await fetch(`/api/tasks/${id}/run`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, file_ids: files, toolsets: tools })
  });

  // Throw an error if the request failed.
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // Convert the reponse to json.
  const json = await response.json();

  // Yield the initial run.
  yield { type: 'run-update', run: json.run as Run };

  // Fetch the completion stream from the server.
  const stream = await fetch(json.stream.path, {
    credentials: 'include'
  });

  // Throw an error if the request failed.
  if (!stream.ok) {
    throw new Error(`HTTP error! Status: ${stream.status}`);
  }

  // Throw an error if the body is empty.
  if (!stream.body) {
    throw new Error(`Empty stream body: ${json.stream.path}`);
  }

  // Parse the stream into SSE events.
  const sseStream = stream.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new SSEParserStream());

  // Setup the variable to handle the run patches.
  let run = json.run;

  // Iterate the SSE stream and yield the completion parts.
  for await (const event of sseStream) {
    // Handle the task rename event.
    if (event.type === 'hrafnar:taskRename') {
      yield { type: 'task-rename', name: event.data };
      continue;
    }

    // Ignore other event types for now.
    if (event.type !== 'message') {
      continue;
    }

    // Parse the event data as a JSON patch.
    const patch = JSON.parse(event.data);

    // Apply the patch to the run, creating a new run object.
    run = applyOperation(run, patch, undefined, false).newDocument;

    // Yield the patched run.
    yield { type: 'run-update', run: run as Run };
  }
}
