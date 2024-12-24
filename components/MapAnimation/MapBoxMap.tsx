import React, { useRef, useState } from "react";
import { Map, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MapMarkers from './MarkPoints';
import AltitudeTimeline from './AltitudeTimeline';
import FlightAnimation from './FlightAnimation';

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 10000,
      FLIGHT_DURATION: 20000,
      INITIAL_ZOOM: 2,
      FLIGHT_ZOOM: 19,
      PITCH: 80,
      POINT_RADIUS_KM: 0.5,
      REQUIRED_ZOOM: 12,
      MAX_POINTS: 10,
      MIN_ALTITUDE: 0.5,
      MAX_ALTITUDE: 1
    },
  }
};

// Helper function to calculate distance between points
const calculateDistance = (point1: Point, point2: Point): number => {
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

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
}

interface PointData {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 0,
  zoom: CONFIG.map.drone.INITIAL_ZOOM,
  pitch: 20,
  bearing: 0,
};

const MapboxMap: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validatePoint = (newPoint: PointData): string | null => {
    if (isAnimating) {
      return "Cannot add points while animating";
    }

    if (viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM) {
      return `Please zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} or higher`;
    }

    if (points.length >= CONFIG.map.drone.MAX_POINTS) {
      return `Maximum ${CONFIG.map.drone.MAX_POINTS} points allowed`;
    }

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const distance = calculateDistance(
        lastPoint, 
        { ...newPoint, altitude: 0, index: 0 }
      );
      
      if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
        return `New point must be within ${CONFIG.map.drone.POINT_RADIUS_KM}km of last point`;
      }
    }

    return null;
  };

  const handleMapClick = (event: any) => {
    const { lng, lat } = event.lngLat;
    const pointData = { 
      longitude: lng, 
      latitude: lat, 
      zoom: viewState.zoom 
    };

    const error = validatePoint(pointData);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    handleAddPoint(pointData);
  };

  const handleAddPoint = (pointData: PointData) => {
    setPoints(prev => [...prev, {
      ...pointData,
      altitude: CONFIG.map.drone.MIN_ALTITUDE,
      index: prev.length + 1
    }]);
  };

  const handleAltitudeChange = (index: number, altitude: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = { ...newPoints[index], altitude };
      return newPoints;
    });
  };

  const resetPoints = () => {
    setPoints([]);
    setErrorMessage("");
  };

  const handleAnimationStart = () => {
    setIsAnimating(true);
    setAnimationProgress(0);
  };

  const handleAnimationCancel = () => {
    setIsAnimating(false);
    // setPoints([]);
    setAnimationProgress(0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map stats display */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded space-y-2 font-mono text-sm z-50">
        <div>Longitude: {viewState.longitude.toFixed(6)}°</div>
        <div>Latitude: {viewState.latitude.toFixed(6)}°</div>
        <div>Zoom: {viewState.zoom.toFixed(2)}</div>
        <div>Pitch: {viewState.pitch.toFixed(2)}°</div>
        <div>Bearing: {viewState.bearing.toFixed(2)}°</div>
      </div>

      {/* Main map component */}
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        // projection="globe"
      >
        <MapMarkers
          points={points}
          isAnimating={isAnimating}
          viewState={viewState}
          CONFIG={CONFIG}
          onAddPoint={handleAddPoint}
          onError={setErrorMessage}
        />
      </Map>

      {/* Altitude Timeline */}
      {points.length > 0 && (
        <AltitudeTimeline 
          points={points}
          onAltitudeChange={handleAltitudeChange}
          isAnimating={isAnimating}
          animationProgress={animationProgress}
        />
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <div className="flex flex-col items-end space-y-2">
          <div className="flex space-x-2">
            {points.length > 0 && !isAnimating && (
              <Button
                onClick={resetPoints}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Reset Points
              </Button>
            )}
            
            <FlightAnimation
              points={points}
              isAnimating={isAnimating}
              CONFIG={CONFIG}
              onAnimationStart={handleAnimationStart}
              onAnimationCancel={handleAnimationCancel}
              onViewStateChange={setViewState}
              onAnimationProgress={setAnimationProgress}
            />
          </div>
          
          <div className="text-white bg-black/50 p-2 rounded text-right">
            {errorMessage ? (
              <span className="text-red-400">{errorMessage}</span>
            ) : (
              <>
                {viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM && 
                  `Zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} to start marking points`}
                {viewState.zoom >= CONFIG.map.drone.REQUIRED_ZOOM && (
                  <>
                    {points.length === 0 && 'Click to place first point'}
                    {points.length > 0 && !isAnimating && 
                      `Place point ${points.length + 1} within yellow circle (${points.length}/${CONFIG.map.drone.MAX_POINTS})`}
                    {isAnimating && 'In flight...'}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;