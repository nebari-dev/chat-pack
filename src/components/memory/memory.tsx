import type {
  ReactNode
} from "react";

import {
  useQuery, useQueryClient
} from "@tanstack/react-query";

import {
  DataTable, MemoryColumns
} from "./";

import * as api from "@/api";

export function Memory(): ReactNode {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
      queryKey: ["memories"],
      queryFn: api.getMemories,
  });

  async function handleDeleteSelected(selected: api.MemoryItem[]) {
    const ids = selected.map(item => item.memory_id);

    try {
      await api.deleteMemories(ids);

      // Refresh the data in React Query cache
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    } catch (err) {
      console.error("Failed to delete memories:", err);
    }
  }

  if (isLoading || !data ) return null;
  if (error) return null;

  const rows = data.data;

  return (
    <main className="w-full p-5">
      <h1 className="mb-4 text-lg font-semibold">Memories</h1>
      <DataTable
        columns={MemoryColumns}
        data={rows}
        onDeleteSelected={handleDeleteSelected}
      />
    </main>
  );
}