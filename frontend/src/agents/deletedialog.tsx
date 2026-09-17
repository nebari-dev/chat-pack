/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { useState } from 'react';

import type * as api from '@/api';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';

import { useAgentsConfig } from '@/context';

/**
 * A React component that confirms deleting a dynamic agent.
 */
export function DeleteAgentDialog(props: DeleteAgentDialog.Props): ReactNode {
  // Extract the props.
  const { agent, onClose } = props;

  // Fetch the delete handler.
  const { deleteAgent } = useAgentsConfig();

  // Setup the submission state.
  const [pending, setPending] = useState(false);

  // Resolve the display name.
  const name = agent?.capabilities.identity?.name ?? agent?.id ?? '';

  // Create the open-change handler.
  const handleOpenChange = (next: boolean) => {
    if (!next && !pending) {
      onClose();
    }
  };

  // Create the confirm handler.
  //
  // Failures are toasted by the global mutation cache; the dialog stays open.
  const handleConfirm = async () => {
    if (!agent) {
      return;
    }
    setPending(true);
    try {
      await deleteAgent(agent.id);
      onClose();
    } catch {
      // Already reported to the user.
    } finally {
      setPending(false);
    }
  };

  // Return the rendered component.
  return (
    <AlertDialog open={agent !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Chats bound to this agent will no longer be able to run. Custom
            agents are kept in memory and cannot be restored once deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * The namespace for the `DeleteAgentDialog` statics.
 */
export namespace DeleteAgentDialog {
  /**
   * A type alias for the `DeleteAgentDialog` props.
   */
  export type Props = {
    /**
     * The agent pending deletion, or `null` when the dialog is closed.
     */
    readonly agent: api.AgentConfig | null;

    /**
     * A callback invoked when the dialog should close.
     */
    readonly onClose: () => void;
  };
}
