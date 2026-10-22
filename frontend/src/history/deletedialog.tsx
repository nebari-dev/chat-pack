/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * A React component that asks the user to confirm deleting conversations.
 */
export function DeleteDialog(props: DeleteDialog.Props): ReactNode {
  const { names, pending, onConfirm, onCancel } = props;

  const count = names.length;
  const title =
    count === 1 ? `Delete “${names[0]}”?` : `Delete ${count} conversations?`;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <Dialog open={count > 0} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Their messages and tool results are deleted too. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            loading={pending}
            loadingText="Deleting…"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The namespace for the `DeleteDialog` statics.
 */
export namespace DeleteDialog {
  /**
   * A type alias for the `DeleteDialog` props.
   */
  export type Props = {
    /**
     * The names of the conversations to delete; empty closes the dialog.
     */
    readonly names: readonly string[];

    /**
     * Whether the delete is in flight.
     */
    readonly pending: boolean;

    /**
     * Called when the user confirms.
     */
    readonly onConfirm: () => void;

    /**
     * Called when the user cancels or dismisses the dialog.
     */
    readonly onCancel: () => void;
  };
}
