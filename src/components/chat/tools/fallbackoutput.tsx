import type { ReactNode } from "react";
import { memo } from "react";
import type { AnyRow } from "./austinpermits-types";

export function FallbackOutput(props: FallbackOutput.Props): ReactNode {
  const { data } = props;
  const payload = data ?? null;

  // Error: render raw string in red (not JSON)
  if (typeof payload === "string") {
    return (
      <div className="overflow-auto max-h-128">
        <pre className="text-xs text-red-600">
          {payload}
        </pre>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-128">
      <pre className="text-xs">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

export const FallbackOutputMemo = memo(FallbackOutput);

export namespace FallbackOutput {
  export type Props = {
    data?: AnyRow[] | Record<string, AnyRow[]> | string | null;
  };
}
