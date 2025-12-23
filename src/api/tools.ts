/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as v from 'valibot';


/**
 * The schema for an Agno tool call.
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
 * The type alias for an Ango tool call.
 */
export
type ToolCall = v.InferOutput<typeof toolCallSchema>;


/**
 * The schema for an Agno tool detail.
 */
export
const toolDetailSchema = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  parameters: v.object({
    type: v.optional(v.string()),
    properties: v.record(v.string(), v.unknown()),
    required: v.array(v.string()),
    additionalProperties: v.optional(v.boolean()),
  }),
  requires_confirmation: v.optional(v.boolean()),
  external_execution: v.optional(v.boolean()),
});


/**
 * The type alias for an Agno tool detail.
 */
export
type ToolDetail = v.InferOutput<typeof toolDetailSchema>;
