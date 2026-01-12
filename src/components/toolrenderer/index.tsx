/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ToolCallMessagePartProps
} from '@assistant-ui/react';

import type {
  ReactNode
} from 'react';

import {
  ToolFallback
} from '@/components/assistant-ui/tool-fallback';

import {
  EChartRenderer
} from './echartrenderer';

import {
  HITLRenderer
} from './hitlrenderer';


/**
 * A react component that renders all tool calls for AUI threads.
 *
 * This component is used as the "override" tool call renderer for
 * assistant-ui and handles the dispatch for all tool calls in the
 * app. If it detects a known mime type that we can handle, it will
 * dispatch to that renderer. Otherwise, it will fallback to the
 * default tool renderer provided by assisant-ui.
 *
 * By using this component as the override, it provides a simpler entry
 * point for customizing tool rendering vs the AUI hook/component approach,
 * which requires the app to know the explicit tool names ahead of time.
 *
 * TODO add support for MCP-UI tool results.
 */
export
function ToolRenderer(props: ToolCallMessagePartProps): ReactNode {
  // Try to cast the result to a known mime result.
  const mimeResult = Private.castResult(props.result);

  // If the cast failed, fallback to the default AUI tool renderer.
  if (!mimeResult) {
    return <ToolFallback { ...props } />;
  }

  // Dispatch to the known renderer.
  switch (mimeResult.mimeType) {
  case 'application/vnd.openteams-echart':
    return <EChartRenderer result={ mimeResult } />;
  case 'application/vnd.openteams-agno-hitl':
    return <HITLRenderer result={ mimeResult } />;
  default:
    throw 'unreachable';
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the known mime results.
   */
  export
  type MimeResult = (
    EChartRenderer.MimeResult |
    HITLRenderer.MimeResult
  );

  /**
   * A function that will safely cast an unknown tool result to a mime result.
   *
   * If the cast cannot be made, this will return `null`.
   */
  export
  function castResult(result: unknown): MimeResult | null {
    // Bail if the result is empty.
    if (!result) {
      return null;
    }

    // Bail is the result type is not a string.
    if (typeof result !== 'string') {
      return null;
    }

    // Try to parse the string as JSON.
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }

    // Bail if the result is empty.
    if (!result) {
      return null;
    }

    // Bail if the result is not an object.
    if (typeof result !== 'object') {
      return null;
    }

    // Bail if the result does not have a mime type.
    if (!('mimeType' in result)) {
      return null;
    }

    // Bail if the mime type is not a string.
    if (typeof result.mimeType !== 'string') {
      return null;
    }

    // Bail if the result does not have data.
    if (!('data' in result)) {
      return null;
    }

    // Dispatch on the mime type.
    switch (result.mimeType) {
    case 'application/vnd.openteams-echart':
    case 'application/vnd.openteams-agno-hitl':
      return { mimeType: result.mimeType, data: result.data as any };
    default:
      return null;
    }
  }
}
