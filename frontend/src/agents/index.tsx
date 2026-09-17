/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Link } from '@tanstack/react-router';

import { Plus } from 'lucide-react';

import type { ReactNode } from 'react';

import { useState } from 'react';

import type * as api from '@/api';

import { Button } from '@/components/ui/button';

import { useAgentsConfig } from '@/context';

import { DeleteAgentDialog } from './deletedialog';

import { AgentDialog } from './dialog';

import { AgentsTable } from './table';

export { makeAgentId } from './slug';

/**
 * A React component that renders the agents page.
 */
export function AgentsPage(): ReactNode {
  // Fetch the page config.
  const { canWrite, models } = useAgentsConfig();

  // Setup the state for the agent pending deletion.
  const [deleteTarget, setDeleteTarget] = useState<api.AgentConfig | null>(
    null,
  );

  // Create the handler for closing the delete dialog.
  const handleDeleteClose = () => {
    setDeleteTarget(null);
  };

  // Return the rendered component.
  return (
    <main className="grow min-w-0 flex flex-col">
      <div className="px-4 py-2 flex flex-row items-center gap-4 border-b border-bd-neutral-default">
        <h2 className="text-lg font-semibold">Agents</h2>
        <div className="grow" />
        {canWrite ? (
          <Private.NewAgentButton enabled={models.length > 0} />
        ) : null}
      </div>
      <AgentsTable onDelete={setDeleteTarget} />
      <AgentDialog />
      <DeleteAgentDialog agent={deleteTarget} onClose={handleDeleteClose} />
    </main>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the `NewAgentButton` props.
   */
  export type NewAgentButtonProps = {
    /**
     * Whether creation is possible (at least one model is configured).
     */
    readonly enabled: boolean;
  };

  /**
   * A React component that renders the "New agent" affordance.
   */
  export function NewAgentButton(props: NewAgentButtonProps): ReactNode {
    // Extract the props.
    const { enabled } = props;

    // Explain a disabled button rather than leaving the user guessing.
    if (!enabled) {
      return (
        <div className="flex flex-row items-center gap-2">
          <span className="text-sm text-muted-foreground">
            No models configured
          </span>
          <Button size="sm" disabled>
            <Plus />
            New agent
          </Button>
        </div>
      );
    }

    // Return the rendered component.
    return (
      <Button size="sm" asChild>
        <Link to="/agents" search={{ new: true }}>
          <Plus />
          New agent
        </Link>
      </Button>
    );
  }
}
