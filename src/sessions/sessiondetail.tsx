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

  // Return the rendered component.
  return (
    <div className='border-l border-bd-neutral-default flex flex-col min-h-0'>
      <DetailHeader detail={ detail } tabId={ tabId } setTabId={ setTabId } />
      {
        tabId === 'history' ?
        <HistoryRenderer detail={ detail } /> :
        tabId === 'metrics' ?
        <MetricsRenderer detail={ detail } /> :
        tabId === 'details' ?
        <DetailsRenderer detail={ detail } /> :
        null
      }
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
