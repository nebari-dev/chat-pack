/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import {
  createContext, useContext
} from 'react';

import * as api from '@/api';


/**
 * A type alias for the `MetricsConfig.update()` options.
 */
export
type MetricsConfigUpdateOptions = {
  /**
   * The month for the queried metrics.
   */
  readonly month: number;

  /**
   * The year for the queried metrics.
   */
  readonly year: number;
};


/**
 * A type alias for the metrics config.
 */
export
type MetricsConfig = {
  /**
   * The month for the queried metrics.
   */
  readonly month: number;

  /**
   * The year for the queried metrics.
   */
  readonly year: number;

  /**
   * Whether the current year/month is the first available.
   */
  readonly atStart: boolean;

  /**
   * Whether the current year/month is the last available.
   */
  readonly atEnd: boolean;

  /**
   * The loaded metrics data for the year/month.
   */
  readonly data: api.Metrics;

  /**
   * A callback to update the config.
   */
  readonly update: (options: MetricsConfigUpdateOptions) => void;
};


/**
 * The metrics config provider.
 */
export
const MetricsConfigProvider = createContext<MetricsConfig | undefined>(undefined);


/**
 * A hook which returns the metrics config.
 */
export
function useMetricsConfig(): MetricsConfig {
  const config = useContext(MetricsConfigProvider);
  if (config === undefined) {
    throw new Error('missing `MetricsConfigProvider`');
  }
  return config;
}
