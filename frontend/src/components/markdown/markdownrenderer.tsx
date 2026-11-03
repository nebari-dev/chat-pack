/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import Markdown, { type Components } from 'react-markdown';

import rehypeKatex from 'rehype-katex';

import remarkGfm from 'remark-gfm';

import remarkMath from 'remark-math';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

/**
 * A react component that renders markdown configured for Nebari Chat.
 */
export function MarkdownRenderer(props: MarkdownRenderer.Props): ReactNode {
  // Extract the props.
  const { content, className } = props;

  // Return the rendered component.
  //
  // The markdown elements are formatted in `main.css` based on the
  // `ot-NebariChat-markdown` class name. Do not remove it.
  return (
    <div className={cn('ot-NebariChat-markdown', className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={Private.markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
}

/**
 * The namespace for the `MarkdownRenderer` statics.
 */
export namespace MarkdownRenderer {
  /**
   * A type alias for the `MarkdownRenderer` props.
   */
  export type Props = {
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
   * Tables render with the Nebari table parts. react-markdown also passes the
   * source `node`, which is dropped so it never reaches the DOM.
   */
  export const markdownComponents: Components = {
    table: ({ node, ...props }) => (
      <Table scrollContainerClassName="my-6" {...props} />
    ),
    thead: ({ node, ...props }) => <TableHeader {...props} />,
    tbody: ({ node, ...props }) => <TableBody {...props} />,
    tr: ({ node, ...props }) => <TableRow {...props} />,
    // `TableHead` types its click and key handlers for a sortable header
    // button, which markdown headers never are.
    th: ({ node, onClick, onKeyDown, ...props }) => <TableHead {...props} />,
    td: ({ node, ...props }) => <TableCell {...props} />,
  };
}
