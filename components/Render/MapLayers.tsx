import { useEffect, useCallback } from 'react';

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
  label?: string;
  originalPosition?: {
    longitude: number;
    latitude: number;
  };
}

export const useMapPoints = (
  map: mapboxgl.Map | null,
  points: Point[],
  showMapBoxPlacesLabels: boolean
) => {
  const cleanupPointLayers = useCallback(() => {
    if (!map) return;

    points.forEach((point, index) => {
      // Only clean up if there was a label
      if (point.label) {
        const pointSourceId = `point-label-${index}`;
        const pinBaseId = `point-pin-base-${index}`;
        const pinShadowId = `point-pin-shadow-${index}`;
        const textLayerId = `point-label-text-${index}`;

        // Remove layers first
        [textLayerId, pinBaseId, pinShadowId].forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });

        // Then remove the source
        if (map.getSource(pointSourceId)) {
          map.removeSource(pointSourceId);
        }
      }
    });
  }, [map, points]);

  const createPointLayers = useCallback(() => {
    if (!map || !showMapBoxPlacesLabels) return;

    points.forEach((point, index) => {
      // Only create layers for points with labels
      if (point.label) {
        const pointSourceId = `point-label-${index}`;
        const pinBaseId = `point-pin-base-${index}`;
        const pinShadowId = `point-pin-shadow-${index}`;
        const textLayerId = `point-label-text-${index}`;

        // Only create if source doesn't exist
        if (!map.getSource(pointSourceId)) {
          // Add the source
          map.addSource(pointSourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [point.longitude, point.latitude]
              },
              properties: {
                label: point.label
              }
            }
          });

          // Add shadow for depth
          map.addLayer({
            id: pinShadowId,
            type: 'circle',
            source: pointSourceId,
            paint: {
              'circle-radius': 8,
              'circle-blur': 1,
              'circle-color': '#000000',
              'circle-opacity': 0.3,
              'circle-translate': [3, 3]
            }
          });

          // Add pin base (the "pole")
          map.addLayer({
            id: pinBaseId,
            type: 'circle',
            source: pointSourceId,
            paint: {
              'circle-radius': 4,
              'circle-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#1a73e8'
            }
          });

          // Add text layer
          map.addLayer({
            id: textLayerId,
            type: 'symbol',
            source: pointSourceId,
            layout: {
              'text-field': ['get', 'label'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': 14,
              'text-offset': [0, -2],
              'text-anchor': 'bottom',
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-max-width': 12
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': 'rgba(0,0,0,0.75)',
              'text-halo-width': 1.5
            }
          });
        }
      }
    });
  }, [map, points, showMapBoxPlacesLabels]);

  useEffect(() => {
    if (!map) return;

    // Clean up existing layers first
    cleanupPointLayers();

    // Create new layers if showMapBoxPlacesLabels is true
    if (showMapBoxPlacesLabels) {
      createPointLayers();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      cleanupPointLayers();
    };
  }, [map, points, showMapBoxPlacesLabels, cleanupPointLayers, createPointLayers]);
};