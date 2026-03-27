/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as L from 'leaflet';

import type {
  ReactNode
} from 'react';

import {
  useEffect, useRef
} from 'react';

import 'leaflet/dist/leaflet.css';


/**
 * A react component that renders a **simple** Leaflet map.
 */
export
function LeafletRenderer(props: LeafletRenderer.Props): ReactNode {
  // Extract the props.
  const { center, features, className } = props;

  // Create the ref to hold the leaflet node.
  const ref = useRef<HTMLDivElement>(null);

  // Use an effect to create the map on mount.
  useEffect(() => {
    // Fetch the node for the map.
    const node = ref.current!;

    // Create the callback to attach popups to the map.
    //
    // FIXME: types
    const onEachFeature = (feature: any, layer: L.Layer) => {
      if (feature.properties?.popup) {
        layer.bindPopup(feature.properties.popup);
      }
    };

    // Create the map and center it.
    const map = L.map(node).setView(center, 10);

    // Add the tile layer.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Add the GeoJSON features.
    L.geoJSON(features, { onEachFeature }).addTo(map);

    // Return the cleanup function.
    return () => { map.remove(); };
  }, [center, features]);  // FIXME: more efficient updates on prop changes.

  // Return the rendered component.
  return <div ref={ ref } className={ className } />;
}


/**
 * The namespace for the `LeafletRenderer` statics.
 */
export
namespace LeafletRenderer {
  /**
   * A type alias for the `LeafletRenderer` props.
   */
  export
  type Props = {
    // The [lat, long] center of the map.
    readonly center: [number, number];

    // The GeoJSON Feature Collection to add to the map.
    readonly features: any;

    // The classname to add to the rendered component.
    readonly className?: string;
  };
}
