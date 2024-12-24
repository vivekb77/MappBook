import React from 'react';
import { Marker, Source, Layer } from 'react-map-gl';

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
  originalPosition?: {
    longitude: number;
    latitude: number;
  };
}

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
  viewState: MapViewState;
  CONFIG: {
    map: {
      styles: {
        satellite: string;
      };
      drone: {
        ROTATION_DURATION: number;
        FLIGHT_DURATION: number;
        INITIAL_ZOOM: number;
        FLIGHT_ZOOM: number;
        PITCH: number;
        POINT_RADIUS_KM: number;
        REQUIRED_ZOOM: number;
        MAX_POINTS: number;
        MIN_ALTITUDE: number;
        MAX_ALTITUDE: number;
      };
    };
  };
  onPointMove: (index: number, lng: number, lat: number) => void;
  onError: (message: string) => void;
}

const calculateDistance = (point1: { longitude: number; latitude: number }, point2: { longitude: number; latitude: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

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

const CustomMarker: React.FC<{ index: number; isDragging?: boolean }> = ({ index, isDragging }) => {
  return (
    <div className="relative cursor-grab active:cursor-grabbing">
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M15 0C6.71573 0 0 6.71573 0 15C0 23.2843 15 42 15 42C15 42 30 23.2843 30 15C30 6.71573 23.2843 0 15 0Z" 
          fill={isDragging ? "#FF4B4B" : "#4285F4"}
        />
        <circle cx="15" cy="15" r="12" fill="white"/>
        <text 
          x="15" 
          y="20" 
          textAnchor="middle" 
          fill={isDragging ? "#FF4B4B" : "#4285F4"}
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
  CONFIG,
  onPointMove,
  onError
}) => {
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);

  const validateDrag = (point: Point, newLng: number, newLat: number): boolean => {
    const originalPos = point.originalPosition || { longitude: point.longitude, latitude: point.latitude };
    const distance = calculateDistance(originalPos, { longitude: newLng, latitude: newLat });
    
    if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
      onError(`Cannot move point more than ${CONFIG.map.drone.POINT_RADIUS_KM}km from original position`);
      return false;
    }
    return true;
  };

  const handleDragStart = (index: number) => {
    if (isAnimating) {
      onError("Cannot move points while animating");
      return;
    }
    setDraggingIndex(index);
  };

  const handleDrag = (index: number, { lng, lat }: { lng: number; lat: number }) => {
    const point = points[index];
    if (validateDrag(point, lng, lat)) {
      onPointMove(index, lng, lat);
    }
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
  };

  const pathGeoJson = points.length > 0 ? createPathGeoJson(points) : null;
  const nextPointCircleGeoJson = points.length > 0 ? 
    createCircleGeoJson(points[points.length - 1], CONFIG.map.drone.POINT_RADIUS_KM) : null;

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

      {/* Next Point Range Circle */}
      {nextPointCircleGeoJson && !isAnimating && (
        <Source type="geojson" data={nextPointCircleGeoJson as GeoJSON.FeatureCollection | GeoJSON.Feature}>
          <Layer
            id="next-point-circle"
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

      {/* Movement Range Circles for each point */}
      {points.map((point, index) => {
        const movementCircle = createCircleGeoJson(
          point.originalPosition ? 
            { ...point, latitude: point.originalPosition.latitude, longitude: point.originalPosition.longitude } : 
            point,
          CONFIG.map.drone.POINT_RADIUS_KM
        );
        return (
          <Source 
            key={`movement-circle-${index}`} 
            type="geojson" 
            data={movementCircle as GeoJSON.FeatureCollection | GeoJSON.Feature}
          >
            <Layer
              id={`movement-circle-${index}`}
              type="line"
              paint={{
                'line-color': '#00ff00',
                'line-width': 1,
                'line-opacity': index === draggingIndex ? 0.8 : 0.3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        );
      })}

      {/* Markers */}
      {points.map((point, index) => (
        <Marker
          key={point.index}
          longitude={point.longitude}
          
          latitude={point.latitude}
          anchor="bottom"
          draggable={!isAnimating}
          onDragStart={() => handleDragStart(index)}
          onDrag={(e) => handleDrag(index, e.lngLat)}
          onDragEnd={handleDragEnd}
        >
          <CustomMarker index={point.index} isDragging={index === draggingIndex} />
        </Marker>
      ))}
    </>
  );
};

export default MapMarkers;