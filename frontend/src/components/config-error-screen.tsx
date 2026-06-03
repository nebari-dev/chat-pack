/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|-----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';


/**
 * A React component that renders an error screen for misconfiguration.
 */
export
function ConfigErrorScreen(props: ConfigErrorScreen.Props): ReactNode {
  const { title, message } = props;

  return (
    <main className='flex items-center justify-center min-h-screen bg-bg-white'>
      <div className='max-w-lg p-8 text-center'>
        <div className='mb-4 text-6xl'>⚠️</div>
        <h1 className='text-2xl font-bold text-foreground mb-2'>
          { title }
        </h1>
        <p className='text-muted-foreground whitespace-pre-line'>
          { message }
        </p>
      </div>
    </main>
  );
}


/**
 * The namespace for the `ConfigErrorScreen` statics.
 */
export
namespace ConfigErrorScreen {
  /**
   * A type alias for the `ConfigErrorScreen` props.
   */
  export
  type Props = {
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
