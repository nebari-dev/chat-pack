/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as agui from '@ag-ui/core';

import type {
  ReactNode
} from 'react';

import {
  EChartRenderer
} from '@/components/charts/echartrenderer';


/**
 * A react component that renders an ag-ui `ActivityMessage`.
 */
export
function ActivityMessage(props: ActivityMessage.Props): ReactNode {
  // Extract the props.
  const { msg } = props;

  // Create the variable to hold the generated content.
  let content: ReactNode;

  // Dipspatch on the message activity type.
  switch (msg.activityType) {
  case 'application/json+echart':
    content = (
      <EChartRenderer
        className='h-120 p-4 border rounded-md'
        option={ msg.content } />
    );
    break;
  default:
    // ignore other activity types for now
    console.log(`Ignoring activity type: ${msg.activityType}`);
    content = null;
    break;
  }

  // Return the rendered component.
  return content;
}


/**
 * The namespace for the `ActivityMessage` statics.
 */
export
namespace ActivityMessage {
  /**
   * A type alias for the `ActivityMessage` props.
   */
  export
  type Props = {
    /**
     * The ag-ui activity message to render.
     */
    readonly msg: agui.ActivityMessage;
  };
}
