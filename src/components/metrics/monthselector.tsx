// month-selector.tsx
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type MonthSelectorProps = {
  label: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthSelector({
  label,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: MonthSelectorProps): ReactNode {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold">Metrics</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="rounded border px-2 py-1 text-sm disabled:opacity-40"
        >
          <ChevronLeft />
        </button>

        <span className="min-w-[160px] text-center text-sm font-medium">
          {label}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded border px-2 py-1 text-sm disabled:opacity-40"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
