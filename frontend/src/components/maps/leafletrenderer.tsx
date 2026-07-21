/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import * as L from 'leaflet';

import type { ReactNode } from 'react';

import { useEffect, useRef } from 'react';

import 'leaflet/dist/leaflet.css';

/**
 * The minimum interval, in milliseconds, between feature-layer rebuilds.
 *
 * Streamed activities can emit many rapid updates; throttling the rebuilds
 * bounds the work per second while still showing the map filling in as data
 * arrives.
 */
const UPDATE_THROTTLE_MS = 200;

/**
 * A react component that renders a **simple** Leaflet map.
 *
 * The map, tile layer, and shared canvas renderer are created once and reused;
 * only the GeoJSON feature layer is rebuilt when the data changes. Points are
 * drawn as canvas circle markers rather than DOM marker icons, so large,
 * streaming point sets (thousands of points) stay responsive instead of
 * freezing the tab.
 */
export function LeafletRenderer(props: LeafletRenderer.Props): ReactNode {
  // Extract the props.
  const { center, features, className } = props;

  // Create the ref to hold the leaflet node.
  const ref = useRef<HTMLDivElement>(null);

  // Refs holding the long-lived leaflet objects, created once on mount.
  const mapRef = useRef<L.Map | null>(null);
  const rendererRef = useRef<L.Canvas | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Track when the feature layer was last rebuilt so updates can be throttled.
  const lastRenderRef = useRef(0);

  // Keep the latest center available to the mount effect without re-running
  // it (and thus tearing the map down) on every center change.
  const centerRef = useRef(center);
  centerRef.current = center;

  // Create the map exactly once. Recreating the whole map (as a naive effect
  // keyed on the data would) is what makes a large, streaming point set freeze
  // the tab, so the map, tile layer, and canvas renderer live for the mounted
  // lifetime of the component.
  useEffect(() => {
    // Fetch the node for the map.
    const node = ref.current!;

    // Create the map, preferring canvas so vector layers render to a single
    // canvas rather than one DOM node per feature.
    const map = L.map(node, { preferCanvas: true }).setView(
      centerRef.current,
      10,
    );

    // Add the tile layer.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Store the map and a shared canvas renderer for the feature layer.
    mapRef.current = map;
    rendererRef.current = L.canvas();

    // Return the cleanup function.
    return () => {
      map.remove();
      mapRef.current = null;
      rendererRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Rebuild only the feature layer when the data changes, throttled so a burst
  // of streamed updates does not rebuild on every delta.
  useEffect(() => {
    const map = mapRef.current;
    const renderer = rendererRef.current;
    if (!map || !renderer) {
      return;
    }

    // Rebuild the feature layer from the current features.
    const rebuild = (): void => {
      lastRenderRef.current = Date.now();

      // Remove the previous feature layer before drawing the new one.
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      // Draw the GeoJSON features, rendering points as lightweight canvas
      // circle markers batched onto the shared renderer.
      const layer = L.geoJSON(features, {
        pointToLayer: (_feature, latlng) =>
          L.circleMarker(latlng, {
            renderer,
            radius: 4,
            weight: 1,
            fillOpacity: 0.7,
          }),
        onEachFeature: (feature, leafletLayer) => {
          if (feature.properties?.popup) {
            leafletLayer.bindPopup(feature.properties.popup);
          }
        },
      });
      layer.addTo(map);
      layerRef.current = layer;
    };

    // Render immediately if enough time has passed since the last rebuild,
    // otherwise schedule the rebuild for the remainder of the throttle window.
    const sinceLast = Date.now() - lastRenderRef.current;
    const delay = Math.max(0, UPDATE_THROTTLE_MS - sinceLast);
    const timeoutId = setTimeout(rebuild, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [features]);

  // Return the rendered component.
  return <div ref={ref} className={className} />;
}

/**
 * The namespace for the `LeafletRenderer` statics.
 */
export namespace LeafletRenderer {
  /**
   * A type alias for the `LeafletRenderer` props.
   */
  export type Props = {
    // The [lat, long] center of the map.
    readonly center: [number, number];

    // The GeoJSON Feature Collection to add to the map.
    // biome-ignore lint/suspicious/noExplicitAny: GeoJSON payload is untyped.
    readonly features: any;

    // The classname to add to the rendered component.
    readonly className?: string;
  };
}
