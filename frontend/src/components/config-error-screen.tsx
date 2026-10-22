/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import { TriangleAlert } from 'lucide-react';

import type { ReactNode } from 'react';

/**
 * A React component that renders an error screen for misconfiguration.
 */
export function ConfigErrorScreen(props: ConfigErrorScreen.Props): ReactNode {
  const { title, message } = props;

  return (
    <main className="flex min-h-screen grow items-center justify-center bg-canvas">
      <div className="max-w-lg p-8 text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warning text-warning-foreground"
        >
          <TriangleAlert className="size-6" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">
          {title}
        </h1>
        <p className="text-muted-foreground whitespace-pre-line">{message}</p>
      </div>
    </main>
  );
}

/**
 * The namespace for the `ConfigErrorScreen` statics.
 */
export namespace ConfigErrorScreen {
  /**
   * A type alias for the `ConfigErrorScreen` props.
   */
  export type Props = {
    /**
     * The title of the error screen.
     */
    readonly title: string;

    /**
     * The message to display.
     */
    readonly message: string;
  };
}
