/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  Link
} from '@tanstack/react-router';

import {
  Database, MemoryStick, MessageSquarePlus, MessagesSquare, ChartLine
} from 'lucide-react';

import {
  Card
} from '@/components/ui/card'

import type {
  ReactNode
} from 'react';

export
function Explore(): ReactNode {

  // Return the rendered component.
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      <ExplorerLink
        to='/chat'
        title='Chat'
        text='Interact with your agents, teams and workflows'
        icon={<MessageSquarePlus size={15} />} />
      <ExplorerLink
        to='/sessions'
        title='Sessions'
        text='View and manage agents, teams and workflow sessions'
        icon={<MessagesSquare size={15} />} />
      <ExplorerLink
        to='/knowledge'
        title='Sessions'
        text='View and manage your knowledge bases'
        icon={<Database size={15} />} />
      <ExplorerLink
        to='/memory'
        title='Memory'
        text='View and manage user memories and learnings'
        icon={<MemoryStick size={15} />} />
      <ExplorerLink
        to='/metrics'
        title='Sessions'
        text='Monitor the usage of your agents, teams and workflows'
        icon={<ChartLine size={15} />} />
    </div>
  );
}

function ExplorerLink(props: ExplorerLink.Props): ReactNode {
  // Extract the props.
  const {to, icon, title, text} = props;

  // Return the rendered component.
  return (
    <Link to={to}>
      <Card className='px-5'>
        <div className="flex items-center justify-start gap-2">{icon}{title}</div>
        <div>{text}</div>
      </Card>
    </Link>
  );
}

/**
 * The namespace for the `ExplorerLink` component statics.
 */
namespace ExplorerLink {
  /**
   * A type alias for the `ExplorerLink` props.
   */
  export
  type Props = {
    /**
     * The route to use for the link.
     */
    readonly to: string;

    /**
     * The icon for the button.
     */
    readonly icon: ReactNode;

    /**
     * The title for the button.
     */
    readonly title: string;

    /**
     * The description for the button.
     */
    readonly text: string;
  };
}
