import React, { useEffect, useRef, useState } from "react";
import { Map, MapRef, ViewState, Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
      MAX_POINTS: 10
    },
  }
};

interface Point {
  longitude: number;
  latitude: number;
  zoom?: number;
  index: number;
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

const createCircleGeoJson = (center: Point, radiusKm: number) => {
  const points = 64;
  const coords = [];
  const km = radiusKm;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    // Approximate degrees for 1km at the equator
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

const createPathGeoJson = (points: Point[]) => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: points.map(p => [p.longitude, p.latitude])
  }
});
const calculateVerticalBearing = (startPoint: Point, endPoint: Point): number => {
  const dx = endPoint.longitude - startPoint.longitude;
  const dy = endPoint.latitude - startPoint.latitude;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  // Convert to clockwise bearing from north
  return (90 - angle + 360) % 360;
};

const MapboxMap: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const [points, setPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pathGeoJson, setPathGeoJson] = useState<any>(null);
  const [circleGeoJson, setCircleGeoJson] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleMapClick = (event: any) => {
    if (isAnimating) return;
    
    // Check zoom level
    if (viewState.zoom < CONFIG.map.drone.REQUIRED_ZOOM) {
      setErrorMessage(`Please zoom in to level ${CONFIG.map.drone.REQUIRED_ZOOM} or higher`);
      return;
    }

    // Check max points
    if (points.length >= CONFIG.map.drone.MAX_POINTS) {
      setErrorMessage(`Maximum ${CONFIG.map.drone.MAX_POINTS} points allowed`);
      return;
    }
    
    const newPoint = {
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      zoom: viewState.zoom,
      index: points.length + 1
    };

    // Check if point is within radius of last point
    if (points.length > 0) {
      const distance = calculateDistance(points[points.length - 1], newPoint);
      if (distance > CONFIG.map.drone.POINT_RADIUS_KM) {
        setErrorMessage(`New point must be within ${CONFIG.map.drone.POINT_RADIUS_KM}km of last point`);
        return;
      }
    }

    setPoints(prev => {
      const newPoints = [...prev, newPoint];
      setPathGeoJson(createPathGeoJson(newPoints));
      setCircleGeoJson(createCircleGeoJson(newPoint, CONFIG.map.drone.POINT_RADIUS_KM));
      setErrorMessage("");
      return newPoints;
    });
  };

  const resetPoints = () => {
    setPoints([]);
    setPathGeoJson(null);
    setCircleGeoJson(null);
    setErrorMessage("");
  };

  const startDroneAnimation = () => {
    if (points.length < 2) return;
    
    const SEGMENT_DURATION = 3000; // 3 seconds per segment
    const INITIAL_ROTATION_DURATION = 2000; // 2 seconds for initial rotation
    
    setIsAnimating(true);
    const startTime = Date.now();
    let currentSegment = 0;

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Initial rotation and zoom phase
      if (elapsedTime < INITIAL_ROTATION_DURATION) {
        const progress = elapsedTime / INITIAL_ROTATION_DURATION;
        
        // Calculate bearing between first two points
        const bearing = calculateVerticalBearing(points[0], points[1]);
        
        setViewState({
          longitude: points[0].longitude,
          latitude: points[0].latitude,
          zoom: CONFIG.map.drone.INITIAL_ZOOM + (CONFIG.map.drone.FLIGHT_ZOOM - CONFIG.map.drone.INITIAL_ZOOM) * progress,
          pitch: CONFIG.map.drone.PITCH * progress,
          bearing: bearing * progress
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Flight phase
      const flightTime = elapsedTime - INITIAL_ROTATION_DURATION;
      const segmentIndex = Math.floor(flightTime / SEGMENT_DURATION);
      
      if (segmentIndex < points.length - 1) {
        const segmentProgress = (flightTime % SEGMENT_DURATION) / SEGMENT_DURATION;
        const startPoint = points[segmentIndex];
        const endPoint = points[segmentIndex + 1];
        
        // Interpolate between points
        const longitude = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * segmentProgress;
        const latitude = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * segmentProgress;
        const bearing = calculateVerticalBearing(startPoint, endPoint);

        setViewState(prev => ({
          ...prev,
          longitude,
          latitude,
          bearing,
          zoom: CONFIG.map.drone.FLIGHT_ZOOM,
          pitch: CONFIG.map.drone.PITCH
        }));

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - keep current view
        setIsAnimating(false);
        setPoints([]);
        setPathGeoJson(null);
        setCircleGeoJson(null);
      }
    };

    // Start at first point
    setViewState({
      longitude: points[0].longitude,
      latitude: points[0].latitude,
      zoom: CONFIG.map.drone.INITIAL_ZOOM,
      pitch: 0,
      bearing: 0
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsAnimating(false);
    setPoints([]);
    setPathGeoJson(null);
    setCircleGeoJson(null);
    setErrorMessage("");
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Stats Display */}
      <div className="absolute top-4 right-4 bg-black/50 text-white p-4 rounded space-y-2 font-mono text-sm z-50">
        <div>Longitude: {viewState.longitude.toFixed(6)}°</div>
        <div>Latitude: {viewState.latitude.toFixed(6)}°</div>
        <div>Zoom: {viewState.zoom.toFixed(2)}</div>
        <div>Pitch: {viewState.pitch.toFixed(2)}°</div>
        <div>Bearing: {viewState.bearing.toFixed(2)}°</div>
      </div>

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN_MAPP_LOGGED_IN_USER}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle={CONFIG.map.styles.satellite}
        style={{ width: '100%', height: '100%' }}
        projection="globe"
      >
        {/* Path Line */}
        {pathGeoJson && (
          <Source type="geojson" data={pathGeoJson}>
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

        {/* Radius Circle */}
        {circleGeoJson && !isAnimating && (
          <Source type="geojson" data={circleGeoJson}>
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

        {/* Point Markers */}
        {points.map((point) => (
          <Marker
            key={point.index}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
          >
            <div className="relative">
              <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.71573 0 0 6.71573 0 15C0 23.2843 15 42 15 42C15 42 30 23.2843 30 15C30 6.71573 23.2843 0 15 0Z" 
                      fill="#4285F4"/>
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
                  {point.index}
                </text>
              </svg>

            </div>
          </Marker>
        ))}
      </Map>

      {/* Controls - Moved to bottom right */}
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
            
            {points.length >= 2 && !isAnimating && (
              <Button
                onClick={startDroneAnimation}
                className="bg-white text-black hover:bg-gray-100"
              >
                Start Flight
              </Button>
            )}

            {isAnimating && (
              <Button
                onClick={cancelAnimation}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Cancel Flight
              </Button>
            )}
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