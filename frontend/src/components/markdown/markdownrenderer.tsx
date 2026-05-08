/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import Markdown from 'react-markdown';

import rehypeKatex from 'rehype-katex';

import remarkGfm from 'remark-gfm';

import remarkMath from 'remark-math';

import {
  cn
} from '@/lib/utils';


/**
 * A react component that renders markdown configured for Nebari Chat.
 */
export
function MarkdownRenderer(props: MarkdownRenderer.Props): ReactNode {
  // Extract the props.
  const { content, className } = props;

  // Return the rendered component.
  //
  // The markdown elements are formatted in `main.css` based on the
  // `ot-NebariChat-markdown` class name. Do not remove it.
  return (
    <div className={ cn('ot-NebariChat-markdown', className) }>
      <Markdown
        remarkPlugins={ [remarkGfm, remarkMath] }
        rehypePlugins={ [rehypeKatex] }
        components={ Private.markdownComponents }>
        { content }
      </Markdown>
    </div>
  );
}


/**
 * The namespace for the `MarkdownRenderer` statics.
 */
export
namespace MarkdownRenderer {
  /**
   * A type alias for the `MarkdownRenderer` props.
   */
  export
  type Props = {
    /**
     * The markdown content string to be rendered.
     */
    readonly content: string;

    /**
     * The class name to add to the component.
     */
    readonly className?: string;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The custom markdown components.
   *
   * These handle the tags that can't be handled solely in `main.css`.
   */
  export
  const markdownComponents = {
    table: ({ ...props }) => (
      <div className='my-6 w-full border rounded-md overflow-x-auto'>
        <table { ...props } />
      </div>
    )
  } as const;
}
