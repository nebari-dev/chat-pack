/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/

/**
 * A type alias for a server sent event in an `SSEParserStream`.
 */
export type ServerSentEvent = {
  /**
   * The type of the event.
   */
  readonly type: string;

  /**
   * The data payload of the event.
   */
  readonly data: string;

  /**
   * The most recent server-provided id for the event stream.
   */
  readonly id: string;
};

/**
 * A stream which transforms a text stream to `ServerSentEvent`s.
 *
 * This stream parser follows the SSE event-stream spec:
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
 *
 * User code will typically consume this class as part of a `fetch` pipeline:
 *
 * ```typescript
 * const response = await fetch('some/api/stream');
 *
 * const stream = response.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new SSEParserStream());
 *
 * for await (const evt of stream) {
 *   console.log(evt);
 * }
 * ```
 */
export class SSEParserStream extends TransformStream<string, ServerSentEvent> {
  /**
   * Construct a new `SSEParserStream`.
   */
  constructor() {
    super(Private.createTransformer());
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the transformer for the `SSEParserStream`.
   */
  export function createTransformer(): Transformer<string, ServerSentEvent> {
    // Setup the mutable variables for the transformer.
    let eventType = '';
    let dataBuffer = '';
    let lastEventId = '';
    let incomplete = '';

    // Return the transformer object.
    return { transform };

    /**
     * A type alias for the stream controller.
     */
    type Controller = TransformStreamDefaultController<ServerSentEvent>;

    /**
     * The transformer parsing function for transforming a text stream into
     * a `ServerSentEvent` stream.
     *
     * This follows the parsing and dispatch logic in the spec:
     * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
     */
    function transform(chunk: string, controller: Controller): void {
      // Prepend the incomplete text and split the lines.
      const { lines, rest } = splitLines(incomplete + chunk);

      // Update the incomplete text to whatever is leftover.
      incomplete = rest;

      // Process the complete lines of the chunk.
      for (const line of lines) {
        processLine(line, controller);
      }
    }

    /**
     * Process a single line of text for the stream. It is assumed that the
     * line was produced as a result of the `splitLines()` function.
     *
     * This follows the interpretation logic in the spec:
     * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
     */
    function processLine(line: string, controller: Controller): void {
      // If the line is empty, dispatch the accumulated event.
      if (line === '') {
        dispatchEvent(controller);
        return;
      }

      // Ignore lines that start with a `:` character.
      if (line[0] === ':') {
        return;
      }

      // Search for the first `:` character.
      const i = line.indexOf(':');

      // Split the line into name and value.
      let name: string;
      let value: string;
      if (i === -1) {
        name = line;
        value = '';
      } else if (line[i + 1] === ' ') {
        name = line.slice(0, i);
        value = line.slice(i + 2);
      } else {
        name = line.slice(0, i);
        value = line.slice(i + 1);
      }

      // Process the field according to the spec.
      processField(name, value);
    }

    /**
     * Process a single field for the stream. It is assumed that the
     * field was produced as a result of the `processLine()` function.
     *
     * This follows the interpretation logic in the spec:
     * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
     */
    function processField(name: string, value: string): void {
      switch (name) {
        case 'event':
          eventType = value;
          break;
        case 'data':
          dataBuffer += value + '\n';
          break;
        case 'id':
          lastEventId = value.includes('\0') ? lastEventId : value;
          break;
        case 'retry':
          // TODO: Intentially ignored for now until I better understand how
          // or if this value could be useful in the context of a stream.
          console.log(`Ignoring SSE retry | ${name}:${value}`);
          break;
        default:
          // TODO: Any reason to formally report a malformed field? The spec
          // seems to suggest just simply ingoring it and recovering on the
          // next event.
          console.log(`Ignoring malformed SSE field | ${name}:${value}`);
          break;
      }
    }

    /**
     * Dispatch the event if there is data available in the data buffer.
     *
     * This follows the dispatch logic in the spec:
     * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
     */
    function dispatchEvent(controller: Controller): void {
      // Fetch the data buffer and event type.
      const db = dataBuffer;
      const et = eventType || 'message';

      // Reset the data buffer and event type.
      dataBuffer = '';
      eventType = '';

      // Bail early if there is no data for the event.
      if (db === '') {
        return;
      }

      // Remove a trailing line feed character, if it exists.
      const data = db.endsWith('\n') ? db.slice(0, -1) : db;

      // Dispatch the event by enqueuing it in the controller.
      controller.enqueue({ type: et, data, id: lastEventId });
    }
  }

  /**
   * A type alias for `splitLines()` return value.
   */
  type SplitLinesResult = {
    /**
     * The full lines present in the chunk.
     *
     * The newline characters will be removed.
     */
    lines: string[];

    /**
     * The remaining part of the chunk after the last newline character.
     */
    rest: string;
  };

  /**
   * Split a chunk of text into newlines according to the SSE spec:
   *
   * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
   */
  function splitLines(chunk: string): SplitLinesResult {
    // Set up the variables to hold the results.
    const lines: string[] = [];
    let rest = '';

    // Set up the index to track the search position.
    let index = 0;

    // Loop over the chunk extracting the lines.
    while (index < chunk.length) {
      // Search for CRLF first.
      const crlf = chunk.indexOf('\r\n', index);

      // If CRLF was found, slice out the line and increment the index.
      if (crlf !== -1) {
        lines.push(chunk.slice(index, crlf));
        index = crlf + 2;
        continue;
      }

      // Search for LF next.
      const lf = chunk.indexOf('\n', index);

      // If LF was found, slice out the line and increment the index.
      if (lf !== -1) {
        lines.push(chunk.slice(index, lf));
        index = lf + 1;
        continue;
      }

      // Search for CR next.
      const cr = chunk.indexOf('\r', index);

      // If CR was found, slice out the line and increment the index.
      //
      // The exception is if the CR is the last character in the chunk. It
      // may be part of a CRLF pair that was split between chunks. In that
      // case, it has to be treated as part of an incomplete line.
      if (cr !== -1 && cr !== chunk.length - 1) {
        lines.push(chunk.slice(index, cr));
        index = cr + 1;
        continue;
      }

      // At this point, no valid line feeds were found, so the rest of the
      // chunk represents an incomplete line and the process is complete.
      rest = chunk.slice(index);
      break;
    }

    // Return the results of splitting the lines.
    return { lines, rest };
  }
}
