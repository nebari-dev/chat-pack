import {
  createContext, useContext
} from 'react';

export
type MetricsConfig = {
  /**
   * The current type of the chat.
   */
  readonly month: number | undefined;

  /**
   * The current type of the chat.
   */
  readonly year: number | undefined;

  /**
   * A callback to set the type of the chat.
   */
  readonly setDate: (month: number, year: number) => void;
};

export
const MetricsConfigProvider = createContext<MetricsConfig | undefined>(undefined);

/**
 * A hook which returns the chat config.
 */
export
function useMetricsConfig(): MetricsConfig {
  const config = useContext(MetricsConfigProvider);
  if (config === undefined) {
    throw new Error('missing `MetricsConfigProvider`');
  }
  return config;
}
