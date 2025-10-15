import type { ReactNode } from "react";
import { memo } from "react";

export function FallbackOutput(props: FallbackOutput.Props): ReactNode {
  const { part } = props;
  const output = part?.data?.output;
  
  // Handles the output if there is an error
  if (typeof output === "string") {
    return <div className="text-red-600">{output}</div>;
  }

  return (
    <pre className="text-xs whitespace-pre-wrap">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

export const FallbackOutputMemo = memo(FallbackOutput);

export namespace FallbackOutput {
  export type Props = {
    part: any;
  };
}
