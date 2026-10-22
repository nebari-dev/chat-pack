/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { useMutation, useQuery } from '@tanstack/react-query';

import { Link } from '@tanstack/react-router';

import { Plus, Trash2 } from 'lucide-react';

import type { ReactNode } from 'react';

import { useMemo, useState } from 'react';

import * as api from '@/api';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { toast } from '@/components/ui/toast';
import { useAgents } from '@/context';
import { notifyError } from '@/lib/notifications';
import { allThreadsQuery, deleteThreadsMutation } from '@/queries';

import { AgentFilter, ALL_AGENTS } from './agentfilter';
import { type HistoryRow, historyColumns } from './columns';
import { DeleteDialog } from './deletedialog';

/**
 * A React component that renders the conversation history page.
 *
 * The whole history loads once and the table searches, filters, sorts and
 * pages it on the client, so every control responds instantly.
 */
export function History(): ReactNode {
  const agents = useAgents();
  const threads = useQuery(allThreadsQuery);
  const { mutateAsync: deleteThreads, isPending } = useMutation(
    deleteThreadsMutation,
  );

  // The agent filter and the rows waiting for delete confirmation.
  const [agentId, setAgentId] = useState(ALL_AGENTS);
  const [pendingDelete, setPendingDelete] = useState<readonly HistoryRow[]>([]);

  // Shape threads into table rows, newest activity first.
  const rows = useMemo(() => {
    const names = new Map(
      agents.map((a) => [a.id, a.capabilities.identity?.name || a.id]),
    );
    return (threads.data ?? [])
      .filter((t) => agentId === ALL_AGENTS || t.agentId === agentId)
      .map(
        (t): HistoryRow => ({
          id: t.id,
          name: t.name || 'Untitled conversation',
          agentName: names.get(t.agentId) ?? t.agentId,
          createdAt: t.createdAt,
          updatedAt: api.getThreadUpdatedAt(t),
        }),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [threads.data, agents, agentId]);

  const columns = useMemo(
    () => historyColumns((row) => setPendingDelete([row])),
    [],
  );

  const handleConfirmDelete = async () => {
    const count = pendingDelete.length;
    try {
      await deleteThreads(pendingDelete.map((r) => r.id));
      toast.add({
        type: 'success',
        title: `Deleted ${count} ${count === 1 ? 'conversation' : 'conversations'}`,
      });
    } catch (error) {
      notifyError(error);
    } finally {
      setPendingDelete([]);
    }
  };

  const selectionActions = (selected: HistoryRow[]) => (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setPendingDelete(selected)}
    >
      <Trash2 aria-hidden="true" />
      Delete
    </Button>
  );

  const total = threads.data?.length ?? 0;
  const summary = threads.isSuccess
    ? `${total} ${total === 1 ? 'conversation' : 'conversations'}`
    : 'Loading conversations…';

  const newChatLink = <Link to="/chat" />;

  return (
    <main className="flex min-w-0 grow flex-col overflow-y-auto bg-canvas">
      <div className="flex w-full flex-col gap-4 px-6 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-semibold text-xl tracking-tight">History</h1>
            <p className="text-muted-foreground text-sm">{summary}</p>
          </div>
          <Button render={newChatLink} className="hover:no-underline">
            <Plus aria-hidden="true" />
            New chat
          </Button>
        </div>
        <DataTable
          ariaLabel="Conversations"
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          filterColumnId="name"
          filterPlaceholder="Search conversations…"
          selectable
          showPagination
          initialPageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
          toolbarActions={<AgentFilter value={agentId} onChange={setAgentId} />}
          selectionActions={selectionActions}
          loading={threads.isPending}
          error={threads.isError}
          onRetry={() => threads.refetch()}
          emptyTitle="No conversations yet"
          emptyDescription="Start a new chat and it will show up here."
          emptyAction={
            <Button
              render={newChatLink}
              size="sm"
              className="hover:no-underline"
            >
              New chat
            </Button>
          }
        />
      </div>
      <DeleteDialog
        names={pendingDelete.map((r) => r.name)}
        pending={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete([])}
      />
    </main>
  );
}
