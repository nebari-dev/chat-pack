/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import {
  Link
} from '@tanstack/react-router';

import {
  X
} from 'lucide-react';

import type {
  ReactNode
} from 'react';

import {
  MarkdownRenderer
} from '@/components/markdown/markdownrenderer';

import {
  Separator
} from '@/components/ui/separator';


/**
 * A react component that renders the sidebar reasoning content.
 */
export
function SidebarReasoning(props: SidebarReasoning.Props): ReactNode {
  // Extract the props.
  const { message } = props;

  // Return the rendered component.
  return (
    <section>
      <h1 className='p-2 flex flex-row justify-between items-center'>
        <span className='text-xl font-bold'>
          Reasoning
        </span>
        <Link to='.' search={ prev => ({ ...prev, detailId: undefined }) }>
          <X />
        </Link>
      </h1>
      <Separator />
      <div className='px-2'>
        <MarkdownRenderer content={ message.content } />
      </div>
    </section>
  );
}


/**
 * The namespace for the `SidebarReasoning` statics.
 */
export
namespace SidebarReasoning {
  /**
   * A type alias for the `SidebarReasoning` props.
   */
  export
  type Props = {
    /**
     * The reasoning message for the component.
     */
    readonly message: agui.ReasoningMessage;
  };
}
