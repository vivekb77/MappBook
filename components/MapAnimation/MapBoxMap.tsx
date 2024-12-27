import React, { useRef, useState } from "react";
import { Map, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import MapMarkers from './MarkPoints';
import AltitudeTimeline from './AltitudeTimeline';
import FlightAnimation from './FlightAnimation';
import ExportButton from "./Export";
import { Compass, X } from "lucide-react";
import InfoPopUp from "./InfoPopUp";

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 0,//not used from here, flight animation has it 
      FLIGHT_DURATION: 0, //not used from here, flight animation has it
      INITIAL_ZOOM: 1,
      FLIGHT_ZOOM: 16,
      PITCH: 55,
      POINT_RADIUS_KM: 5,
      REQUIRED_ZOOM: 10,
      MAX_POINTS: 10,
      MIN_ALTITUDE: 0,  //not used from here, altitude has it
      MAX_ALTITUDE: 1  //not used from here, altitude has it
    },
  }
};

// Helper function to calculate distance between points
const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371;
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface Point {
  longitude: number;
  latitude: number;
  altitude: number;
  zoom?: number;
  index: number;
  label?: string;
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
  pitch: 0,
  bearing: 0,
};

const MapboxMap: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Validation and handlers remain the same
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
      index: prev.length + 1,
      originalPosition: {
        longitude: pointData.longitude,
        latitude: pointData.latitude
      }
    }]);
  };

  const handlePointMove = (index: number, longitude: number, latitude: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = {
        ...newPoints[index],
        longitude,
        latitude
      };
      return newPoints;
    });
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
    setAnimationProgress(0);
  };

  const handlePointRemove = (index: number) => {
    setPoints(prev => {
      const newPoints = [...prev];
      newPoints.splice(index, 1);
      return newPoints.map((point, i) => ({
        ...point,
        index: i + 1
      }));
    });
    setErrorMessage("");
  };

  return (
    <div className="relative w-full h-full">
      {/* MappBook Logo */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-gray-800/90 p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors border border-gray-700">
          <span className="font-bold text-xl text-blue-400">MappBook</span>
        </div>
      </div>

      {/* Export Buttons */}
      <ExportButton points={points} />

      {/* Map stats display */}
      <div className="absolute top-20 right-4 bg-gray-800/90 text-gray-200 p-4 rounded space-y-2 font-mono text-sm z-50 border border-gray-700">
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
      >
        <MapMarkers
          points={points}
          isAnimating={isAnimating}
          viewState={viewState}
          CONFIG={CONFIG}
          onPointMove={handlePointMove}
          onError={setErrorMessage}
          onUpdatePointLabel={(index: number, label: string) => {
            const newPoints = [...points];
            newPoints[index] = { ...newPoints[index], label };
            setPoints(newPoints);
          }}
          onPointRemove={handlePointRemove}
        />
      </Map>

      {/* Altitude Timeline */}
      {points.length > 0 && (
        <AltitudeTimeline
          points={points}
          onAltitudeChange={handleAltitudeChange}
          onPointRemove={handlePointRemove}
          isAnimating={isAnimating}
          animationProgress={animationProgress}
        />
      )}

      <InfoPopUp />

      {/* Controls */}
      <div className="absolute bottom-48 right-4 space-y-2">
        <div className="text-gray-200 bg-gray-800/90 p-2 rounded text-right border border-gray-700">
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
        <div className="flex flex-col items-end space-y-2">
          <div className="flex space-x-2">
            {points.length > 0 && !isAnimating && (
              <Button
                onClick={resetPoints}
                className="bg-red-500 text-gray-200 hover:bg-red-600 border border-red-400"
              >
                Clear Points
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
        </div>
      </div>

      {/* North Button */}
      <button
        onClick={() => setViewState(prev => ({
          ...prev,
          pitch: 0,
          bearing: 0
        }))}
        className="absolute bottom-[45%] right-[1%] bg-gray-800/90 hover:bg-gray-800 p-3 rounded-full shadow-lg transition-colors border border-gray-700"
        title="Look North"
      >
        <Compass className="w-6 h-6 text-blue-400" />
      </button>
    </div>
  );
};

export default MapboxMap;