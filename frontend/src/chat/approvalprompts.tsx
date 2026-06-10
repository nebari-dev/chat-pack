/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Check, ShieldQuestion, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import {
  decideApproval,
  type PendingApproval,
  usePendingApprovals,
} from './tools';

/**
 * A react component that renders pending human-in-the-loop approval requests.
 *
 * #### Notes
 * The `request_user_approval` frontend tool pauses a run until the user
 * decides, registering a pending request while it waits. This renders each
 * such request inline in the chat as an approval card. It renders nothing
 * when there is nothing awaiting a decision.
 */
export function ApprovalPrompts(): ReactNode {
  // Fetch the requests currently awaiting a decision.
  const pending = usePendingApprovals();

  // Render nothing when no request is outstanding.
  if (pending.length === 0) {
    return null;
  }

  // Return the rendered component.
  return (
    <div className="mt-4 flex flex-col gap-3">
      {pending.map((req) => (
        <Private.ApprovalCard key={req.id} request={req} />
      ))}
    </div>
  );
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders a single approval request.
   */
  export function ApprovalCard(props: ApprovalCard.Props): ReactNode {
    // Extract the props.
    const { request } = props;

    // Build the handler that resolves the request with a decision.
    const decide = (decision: 'approved' | 'rejected') => () => {
      decideApproval(request.id, decision);
    };

    // Return the rendered component.
    return (
      <div className="rounded-sm border border-bd-neutral-default p-3 flex flex-col gap-3">
        <div className="flex flex-row items-start gap-2">
          <ShieldQuestion size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Approval requested
            </span>
            <p className="text-sm font-medium">{request.action}</p>
            {request.details ? (
              <p className="text-sm text-muted-foreground">{request.details}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-row justify-end gap-2">
          <Button size="sm" variant="outline" onClick={decide('rejected')}>
            <X />
            Reject
          </Button>
          <Button size="sm" onClick={decide('approved')}>
            <Check />
            Approve
          </Button>
        </div>
      </div>
    );
  }

  /**
   * The namespace for the `ApprovalCard` statics.
   */
  export namespace ApprovalCard {
    /**
     * A type alias for the `ApprovalCard` props.
     */
    export type Props = {
      /**
       * The pending approval request to render.
       */
      readonly request: PendingApproval;
    };
  }
}
