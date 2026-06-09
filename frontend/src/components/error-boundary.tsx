/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/**
 * A recoverable error fallback screen with a reload action.
 *
 * Shared by the {@link ErrorBoundary} and the router's error component so an
 * uncaught render error or a failed route load shows a recoverable screen
 * rather than a blank page.
 */
export function ErrorFallback(): ReactNode {
  return (
    <main className="flex items-center justify-center min-h-screen bg-bg-white">
      <div className="max-w-lg p-8 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. Reloading the page usually fixes it.
        </p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </main>
  );
}

/**
 * A React error boundary that catches unexpected render errors.
 *
 * Instead of letting an uncaught render error blank the screen, this shows a
 * recoverable fallback with a reload action. Error boundaries must be class
 * components, as there is no hook equivalent for `componentDidCatch`.
 */
export class ErrorBoundary extends Component<
  ErrorBoundary.Props,
  ErrorBoundary.State
> {
  /**
   * Construct a new `ErrorBoundary`.
   */
  constructor(props: ErrorBoundary.Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state so the next render shows the fallback.
   */
  static getDerivedStateFromError(): ErrorBoundary.State {
    return { hasError: true };
  }

  /**
   * Log the error and its component stack for debugging.
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  /**
   * Render the children, or the fallback if an error was caught.
   */
  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorFallback />;
  }
}

/**
 * The namespace for the `ErrorBoundary` statics.
 */
export namespace ErrorBoundary {
  /**
   * A type alias for the `ErrorBoundary` props.
   */
  export type Props = {
    /**
     * The subtree to protect with the boundary.
     */
    readonly children: ReactNode;
  };

  /**
   * A type alias for the `ErrorBoundary` state.
   */
  export type State = {
    /**
     * Whether an error has been caught.
     */
    readonly hasError: boolean;
  };
}
