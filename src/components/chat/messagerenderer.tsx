/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import
  DOMPurify
from 'dompurify';

import
  hljs
from 'highlight.js';

import {
  marked
} from 'marked';

import {
  markedHighlight
} from 'marked-highlight';

import type {
  ReactNode
} from 'react';

import {
  memo, useEffect, useState
} from 'react';

import {
  useAppStore
} from '@/store';

import {
  ChatScroller
} from './chatscroller';

import './messagerenderer.css';


marked.use({
  renderer: {
    link(this: any, token) {
      const { href, title, tokens } = token;
      const text = this.parser.parseInline(tokens);
      const t = title ? ` title="${title}"` : '';
      const h = href ?? '#';
      return `<a href="${h}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});


marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);


marked.setOptions({
  gfm: true,
  breaks: true,
});


/**
 * A React component that renders a message response.
 *
 * #### Notes
 * This component assumes that `chatId`, `runId`, and `stepId` exist in the
 * store.
 */
export
function MessageRenderer(props: MessageRenderer.Props): ReactNode {
  // Extract the props.
  const { chatId, runId, stepId } = props;

  // Fetch the response from the store.
  //
  // The parent dispatch component has already checked the type of the
  // response, so this cast is assumed to be safe.
  const text = useAppStore(store => {
    // Get the chat from the store.
    const chat = store.chats.find(chat => chat.id === chatId)!;

    // Get the run for the chat.
    const run = chat.runs.find(run => run.id === runId)!;

    // Get the step for run.
    const step = run.response.find(step => step.id === stepId)!;

    // Bail if the step is not a `message` kind.
    //
    // This should never happen given the filtering by the parent components,
    // but it makes TypeScript happy.
    if (step.kind !== 'message') {
      return '';
    }

    // Join the content parts into a single string of text.
    return step.parts.flatMap(part => part.data.content_parts).join('');
  });

  // Set up the state to hold the safe HTML.
  const [safeHtml, setSafeHtml] = useState('');

  // Use an effect to render the markdown into HTML.
  useEffect(() => {
    (async () => {
      const html = await marked.parse(text);
      const sanitized = DOMPurify.sanitize(html);
      setSafeHtml(sanitized);
    })();
  }, [text]);

  // Scroll the chat to the bottom after rendering.
  useEffect(() => {
    ChatScroller.scrollToBottom(chatId);
  }, [chatId, safeHtml]);

  // Return the rendered component.
  return (
    <div
      className='markdown-renderer'
      dangerouslySetInnerHTML={ { __html: safeHtml } } />
  );
}


/**
 * A memoized version of `MessageRenderer`.
 */
export
const MessageRendererMemo = memo(MessageRenderer);


/**
 * The namespace for the `MessageRenderer` component statics.
 */
export
namespace MessageRenderer {
  /**
   * A type alias for the `MessageRenderer` props.
   */
  export
  type Props = {
    /**
     * The unique id for the chat.
     */
    readonly chatId: string;

    /**
     * The unique id for the chat run.
     */
    readonly runId: string;

    /**
     * The unique id for the chat run step.
     */
    readonly stepId: string;
  };
}
