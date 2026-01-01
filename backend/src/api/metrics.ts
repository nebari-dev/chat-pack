/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for Agno metrics.
 */
export
const metricsSchema = v.object({
  duration: v.number(),
  input_tokens: v.number(),
  output_tokens: v.number(),
  time_to_first_token: v.number(),
  total_tokens: v.number()
});


/**
 * A type alias for Agno metrics.
 */
export
type Metrics = v.InferOutput<typeof metricsSchema>;
