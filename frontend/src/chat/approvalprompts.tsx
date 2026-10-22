/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { Check, ShieldQuestion, X } from 'lucide-react';

import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
export function ApprovalPrompts(props: ApprovalPrompts.Props): ReactNode {
  // Fetch the requests for this thread currently awaiting a decision.
  const pending = usePendingApprovals(props.threadId);

  // Render nothing when no request is outstanding.
  if (pending.length === 0) {
    return null;
  }

  // Return the rendered component.
  return (
    <div className="flex flex-col gap-3">
      {pending.map((req) => (
        <Private.ApprovalCard key={req.id} request={req} />
      ))}
    </div>
  );
}

/**
 * The namespace for the `ApprovalPrompts` statics.
 */
export namespace ApprovalPrompts {
  /**
   * A type alias for the `ApprovalPrompts` props.
   */
  export type Props = {
    /**
     * The id of the thread whose pending approvals to render, if any.
     */
    readonly threadId: string | undefined;
  };
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A react component that renders a single approval request.
   */
  export function ApprovalCard(props: ApprovalCard.Props): ReactNode {
    const { request } = props;

    const decide = (decision: 'approved' | 'rejected') => () => {
      decideApproval(request.id, decision);
    };

    // The warning variant is an assertive live region, so screen readers
    // announce the request as soon as the agent blocks on it.
    return (
      <Alert variant="warning">
        <ShieldQuestion aria-hidden="true" />
        <AlertTitle>{request.action}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          {request.details ? <p>{request.details}</p> : null}
          <div className="flex flex-row gap-2">
            <Button size="sm" onClick={decide('approved')}>
              <Check aria-hidden="true" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={decide('rejected')}>
              <X aria-hidden="true" />
              Reject
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

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
