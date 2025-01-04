import React, { useEffect, useState } from 'react';
import { Marker, Source, Layer } from 'react-map-gl';
import { Pencil, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  label?: string;
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
  onUpdatePointLabel: (index: number, label: string) => void;
  onPointRemove: (index: number) => void;
  onDistanceChange?: (totalDistance: number, pointDistances: number[]) => void;
}

const calculateDistance = (point1: { longitude: number; latitude: number }, point2: { longitude: number; latitude: number }): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

const createPathGeoJson = (points: Point[]): GeoJSONFeature => {
  if (points.length < 2) return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map(p => [p.longitude, p.latitude])
    }
  };

  // Generate interpolation points between each pair of points
  const interpolatedCoords: [number, number][] = [];
  const numIntermediatePoints = 20; // Increase for smoother curves

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    // Add the start point
    interpolatedCoords.push([start.longitude, start.latitude]);

    // Add intermediate points using cubic interpolation
    for (let j = 1; j < numIntermediatePoints; j++) {
      const t = j / numIntermediatePoints;

      // Cubic interpolation formula
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      // Control points for smoother curves
      const control1 = i > 0 ? points[i - 1] : start;
      const control2 = i < points.length - 2 ? points[i + 2] : end;

      // Calculate interpolated point
      const lng = (2 * t3 - 3 * t2 + 1) * start.longitude +
        (t3 - 2 * t2 + t) * (end.longitude - control1.longitude) +
        (-2 * t3 + 3 * t2) * end.longitude +
        (t3 - t2) * (control2.longitude - start.longitude);

      const lat = (2 * t3 - 3 * t2 + 1) * start.latitude +
        (t3 - 2 * t2 + t) * (end.latitude - control1.latitude) +
        (-2 * t3 + 3 * t2) * end.latitude +
        (t3 - t2) * (control2.latitude - start.latitude);

      interpolatedCoords.push([lng, lat]);
    }
  }

  // Add the final point
  interpolatedCoords.push([points[points.length - 1].longitude, points[points.length - 1].latitude]);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: interpolatedCoords
    }
  };
};

const CustomMarker: React.FC<{
  index: number;
  isDragging?: boolean;
  distance?: number;
  label?: string;
  onLabelClick: () => void;
}> = ({
  index,
  isDragging,
  distance,
  label,
  onLabelClick
}) => {
    return (
      <div className="relative cursor-grab active:cursor-grabbing">
        {/* Distance Display */}
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {distance !== undefined ? `${distance.toFixed(2)} km` : ''}
        </div>

        {/* Label Display */}
        {label && (
          <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {label}
          </div>
        )}

        <div className="flex items-center">
          {/* Marker SVG */}
          <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 0C6.71573 0 0 6.71573 0 15C0 23.2843 15 42 15 42C15 42 30 23.2843 30 15C30 6.71573 23.2843 0 15 0Z"
              fill={isDragging ? "#FF4B4B" : "#4285F4"}
            />
            <circle cx="15" cy="15" r="12" fill="white" />
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

          {/* Label Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLabelClick();
            }}
            className="ml-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };


// Label Dialog Component
const LabelDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => void;
  onRemove: () => void;
  currentLabel: string;
}> = ({ isOpen, onClose, onSave, onRemove, currentLabel }) => {
  const [labelInput, setLabelInput] = useState(currentLabel);
  const MAX_LABEL_LENGTH = 25;

  // Reset input when dialog opens/closes or currentLabel changes
  useEffect(() => {
    setLabelInput(currentLabel || '');
  }, [isOpen, currentLabel]);


  const handleSave = () => {
    const trimmedLabel = labelInput.trim();
    onSave(trimmedLabel);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] sm:w-[440px] rounded-2xl bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xs font-medium text-blue-400">
            Describe this location
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="relative">
            <p className="text-center mb-3 text-sm text-blue-600 font-sans">
              This text appears on the point when you export the video of drone flight
            </p>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value.slice(0, MAX_LABEL_LENGTH))}
              onKeyDown={handleKeyPress}
              placeholder="Description"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pr-20"
              maxLength={MAX_LABEL_LENGTH}
              autoFocus
              aria-label="Point label input"
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {labelInput.length}/{MAX_LABEL_LENGTH} characters
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              aria-label="Save and close"
            >
              <Check className="w-4 h-4" />
              Save & Close
            </button>
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              aria-label="Remove point"
            >
              <X className="w-4 h-4" />
              Remove Point
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


// Calculate cumulative distances for all points
const calculateCumulativeDistances = (points: Point[]): number[] => {
  const distances: number[] = [0]; // First point has 0 distance

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const segmentDistance = calculateDistance(prevPoint, currentPoint);
    distances.push(distances[i - 1] + segmentDistance);
  }

  return distances;
};

export const MapMarkers: React.FC<MapMarkersProps> = ({
  points,
  isAnimating,
  CONFIG,
  onPointMove,
  onError,
  onUpdatePointLabel,
  onPointRemove,
  onDistanceChange
}) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [labelDialogState, setLabelDialogState] = useState<{
    isOpen: boolean;
    pointIndex: number | null;
  }>({
    isOpen: false,
    pointIndex: null
  });

  useEffect(() => {
    const distances = calculateCumulativeDistances(points);
    onDistanceChange?.(
      distances[distances.length - 1] || 0,
      distances
    );
  }, [points, onDistanceChange]);

  const validateDrag = (point: Point, newLng: number, newLat: number): boolean => {
    const originalPos = point.originalPosition || { longitude: point.longitude, latitude: point.latitude };
    const distance = calculateDistance(originalPos, { longitude: newLng, latitude: newLat });

    if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
      onError(`Cannot move point more than ${CONFIG.map.drone.POINT_RADIUS_KM}km from original position`);
      return false;
    }
    return true;
  };

  const handleLabelClick = (index: number) => {
    if (isAnimating) {
      onError("Cannot edit label while animating");
      return;
    }
    setLabelDialogState({
      isOpen: true,
      pointIndex: index
    });
  };

  const handleLabelSave = (label: string) => {
    if (labelDialogState.pointIndex !== null) {
      // Validate label if needed
      if (label.length > 25) {
        onError("Label is too long");
        return;
      }

      // Update the label in the parent component
      onUpdatePointLabel(labelDialogState.pointIndex, label);
    }
    setLabelDialogState({ isOpen: false, pointIndex: null });
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
              'line-color': '#4285F4',
              'line-width': 15,
              'line-opacity': 0.8,
              'line-blur': 1
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

      {/* Movement Range Circles */}
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
      {points.map((point, index) => {
        const distances = calculateCumulativeDistances(points);
        return (
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
            <CustomMarker
              index={point.index}
              isDragging={index === draggingIndex}
              distance={distances[index]}
              label={point.label}
              onLabelClick={() => handleLabelClick(index)}
            />
          </Marker>
        );
      })}

      {/* Label Dialog */}
      <LabelDialog
        isOpen={labelDialogState.isOpen}
        onClose={() => setLabelDialogState({ isOpen: false, pointIndex: null })}
        onSave={handleLabelSave}
        onRemove={() => {
          if (labelDialogState.pointIndex !== null) {
            onPointRemove(labelDialogState.pointIndex);
          }
        }}
        currentLabel={labelDialogState.pointIndex !== null ? points[labelDialogState.pointIndex]?.label || '' : ''}
      />
    </>
  );
};

export default MapMarkers;