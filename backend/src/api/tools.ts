/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * A schema for an Agno tool call.
 */
export
const toolCallSchema = v.object({
  created_at: v.number(),
  result: v.nullish(v.string()),
  tool_call_id: v.string(),
  tool_name: v.string(),
  tool_args: v.looseObject({})
});


/**
 * A type alias for an Ango tool call.
 */
export
type ToolCall = v.InferOutput<typeof toolCallSchema>;
