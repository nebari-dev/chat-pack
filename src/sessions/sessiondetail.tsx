/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useState
} from 'react';

import * as api from '@/api';

import {
  DetailHeader
} from './detailheader';

import {
  DetailsRenderer
} from './detailsrenderer';

import {
  HistoryRenderer
} from './historyrenderer';

import {
  MetricsRenderer
} from './metricsrenderer';


/**
 * A React component that renders the session detail panel.
 */
export
function SessionDetail(props: SessionDetail.Props): ReactNode {
  // Extract the props.
  const { detail } = props;

  // Create the state to track the active tab.
  const [tabId, setTabId] = useState<DetailHeader.TabId>('history');

  // Lookup the content renderer for the selected tab id.
  const ContentRenderer = Private.rendererMap[tabId];

  // Return the rendered component.
  return (
    <div className='border-l border-bd-neutral-default'>
      <DetailHeader detail={ detail } tabId={ tabId } setTabId={ setTabId } />
      <ContentRenderer detail={ detail } />
    </div>
  );
}


/**
 * The namespace for the `SessionDetail` statics.
 */
export
namespace SessionDetail {
  /**
   * A type alias for the `SessionDetail` props.
   */
  export
  type Props = {
    /**
     * The session detail data from the api.
     */
    readonly detail: api.SessionDetail;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A mapping of content type to content renderer.
   */
  export
  const rendererMap = {
    'history': HistoryRenderer,
    'metrics': MetricsRenderer,
    'details': DetailsRenderer
  } as const;
}
