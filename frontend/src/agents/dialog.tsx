/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useNavigate, useSearch } from '@tanstack/react-router';

import type { ReactNode } from 'react';

import { useState } from 'react';

import * as api from '@/api';

import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAgents, useAgentsConfig } from '@/context';

import { AgentForm } from './form';

/**
 * A React component that renders the create/edit agent dialog.
 *
 * The open state is driven by the route's search params: `?new=true` opens
 * the create form and `?edit=<id>` opens the edit form. Closing the dialog
 * clears the params.
 */
export function AgentDialog(): ReactNode {
  // Fetch the route state and the navigation handle.
  const search = useSearch({ from: '/_authenticated/agents' });
  const navigate = useNavigate({ from: '/agents' });

  // Fetch the agents and the page config.
  const agents = useAgents();
  const { canWrite, createAgent, replaceAgent } = useAgentsConfig();

  // Setup the submission state.
  const [pending, setPending] = useState(false);

  // Resolve what the dialog is doing.
  const isNew = search.new === true;
  const editId = search.edit;
  const editing = editId ? agents.find((a) => a.id === editId) : undefined;
  const dynamic = editing ? api.getDynamicAgent(editing) : null;
  const open = canWrite && (isNew || editId !== undefined);

  // Create the handler for closing the dialog.
  const close = () => {
    void navigate({ to: '/agents', search: {} });
  };

  // Create the open-change handler.
  const handleOpenChange = (next: boolean) => {
    if (!next && !pending) {
      close();
    }
  };

  // Create the submit handler.
  //
  // Mutation failures are surfaced as toasts by the global mutation cache, so
  // they are swallowed here and the form stays open for another attempt.
  const handleSubmit = async (definition: api.AgentDefinition) => {
    setPending(true);
    try {
      if (dynamic) {
        await replaceAgent(dynamic, definition);
        close();
      } else {
        const agent = await createAgent(definition);
        await navigate({ to: '/chat', search: { agentId: agent.id } });
      }
    } catch {
      // Already reported to the user.
    } finally {
      setPending(false);
    }
  };

  // Create the dialog body.
  let title: string;
  let description: string;
  let body: ReactNode;
  if (editId !== undefined && !dynamic) {
    title = 'Agent not editable';
    description =
      'This agent was not found or is declared in the server configuration.';
    body = (
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>
          Close
        </Button>
      </DialogFooter>
    );
  } else if (dynamic) {
    title = 'Edit agent';
    description =
      'Saving re-creates the agent under the same id, so existing chats keep working.';
    body = (
      <AgentForm
        key={dynamic.id}
        initial={dynamic.definition}
        submitLabel="Save changes"
        pending={pending}
        onSubmit={handleSubmit}
      />
    );
  } else {
    title = 'New agent';
    description =
      'Custom agents are shared with everyone and are kept in memory until the server restarts.';
    body = (
      <AgentForm
        key="new"
        initial={api.EMPTY_AGENT_DEFINITION}
        submitLabel="Create agent"
        pending={pending}
        onSubmit={handleSubmit}
      />
    );
  }

  // Return the rendered component.
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
