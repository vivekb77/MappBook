import React from 'react';
import { Marker, Source, Layer } from 'react-map-gl';

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

// GeoJSON types
interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface MapMarkersProps {
  points: Point[];
  isAnimating: boolean;
  viewState: {
    zoom: number;
  };
  CONFIG: {
    map: {
      drone: {
        REQUIRED_ZOOM: number;
        MAX_POINTS: number;
        POINT_RADIUS_KM: number;
      };
    };
  };
  onAddPoint: (pointData: { longitude: number; latitude: number; zoom: number }) => void;
  onError: (message: string) => void;
}

const createCircleGeoJson = (center: Point, radiusKm: number): GeoJSONFeature => {
  const points = 64;
  const coords: [number, number][] = [];
  const km = radiusKm;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const lat = center.latitude + (km / 111.32) * Math.cos(rad);
    const lng = center.longitude + (km / (111.32 * Math.cos(center.latitude * Math.PI / 180))) * Math.sin(rad);
    coords.push([lng, lat]);
  }
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords
    }
  };
};

const createPathGeoJson = (points: Point[]): GeoJSONFeature => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: points.map(p => [p.longitude, p.latitude])
  }
});

const CustomMarker: React.FC<{ index: number }> = ({ index }) => {
  return (
    <div className="relative">
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M15 0C6.71573 0 0 6.71573 0 15C0 23.2843 15 42 15 42C15 42 30 23.2843 30 15C30 6.71573 23.2843 0 15 0Z" 
          fill="#4285F4"
        />
        <circle cx="15" cy="15" r="12" fill="white"/>
        <text 
          x="15" 
          y="20" 
          textAnchor="middle" 
          fill="#4285F4" 
          fontSize="14" 
          fontWeight="bold"
          fontFamily="Arial"
        >
          {index}
        </text>
      </svg>
    </div>
  );
};

export const MapMarkers: React.FC<MapMarkersProps> = ({
  points,
  isAnimating,
  CONFIG
}) => {
  const pathGeoJson = points.length > 0 ? createPathGeoJson(points) : null;
  const circleGeoJson = points.length > 0 ? createCircleGeoJson(points[points.length - 1], CONFIG.map.drone.POINT_RADIUS_KM) : null;

  return (
    <>
      {/* Path Layer */}
      {pathGeoJson && (
        <Source type="geojson" data={pathGeoJson as GeoJSON.FeatureCollection | GeoJSON.Feature}>
          <Layer
            id="path-layer"
            type="line"
            paint={{
              'line-color': '#ffffff',
              'line-width': 2,
              'line-opacity': 0.8
            }}
          />
        </Source>
      )}

      {/* Range Circle Layer */}
      {circleGeoJson && !isAnimating && (
        <Source type="geojson" data={circleGeoJson as GeoJSON.FeatureCollection | GeoJSON.Feature}>
          <Layer
            id="circle-layer"
            type="line"
            paint={{
              'line-color': '#ffff00',
              'line-width': 2,
              'line-opacity': 0.8,
              'line-dasharray': [2, 2]
            }}
          />
        </Source>
      )}

      {/* Markers */}
      {points.map((point) => (
        <Marker
          key={point.index}
          longitude={point.longitude}
          latitude={point.latitude}
          anchor="bottom"
        >
          <CustomMarker index={point.index} />
        </Marker>
      ))}
    </>
  );
};

export default MapMarkers;