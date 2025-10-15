import type { ReactNode } from "react";
import { memo } from "react";

export function ToolInputPanel(props: ToolInputPanel.Props): ReactNode {
  const { part } = props;
  const input = part?.data?.input;

  if (typeof input === "object" && input != null) {
    const keys = Object.keys(input);
    if (keys.length === 0) return null;
    if (keys.length === 1) {
      const only = (input as any)[keys[0]];
      if (typeof only === "string") {
        return <pre className="text-xs whitespace-pre-wrap break-words">{only}</pre>;
      }
    }
  }

  const render = typeof input === "string" ? input : JSON.stringify(input, null, 2);

  return (
    <pre className="text-xs whitespace-pre-wrap break-words">
      {render}
    </pre>
  );
}

export const ToolInputPanelMemo = memo(ToolInputPanel);

export namespace ToolInputPanel {
  export type Props = {
    part: any;
  };
}
