import React, { useEffect, useRef, useState } from "react";
import { Map, MapRef, ViewState, Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";

const CONFIG = {
  map: {
    styles: {
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    },
    drone: {
      ROTATION_DURATION: 10000,    // 2 seconds for initial rotation
      FLIGHT_DURATION: 20000,    // 2 minutes for the flight
      INITIAL_ZOOM: 2,           // Start zoomed out to see globe
      FLIGHT_ZOOM: 18,          // Zoom level during flight
      PITCH: 80,                // Looking forward and down
      RADIUS_KM: 1              // Selection radius in kilometers
    },
  }
};

interface Point {
  longitude: number;
  latitude: number;
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

const createGeoJsonLine = (start: Point, end: Point) => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude]
    ]
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
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lineGeoJson, setLineGeoJson] = useState<any>(null);
  const [circleGeoJson, setCircleGeoJson] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleMapClick = (event: any) => {
    if (isAnimating) return;
    
    const newPoint = {
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    };

    setSelectedPoints(prev => {
      if (prev.length === 0) {
        // First point - create radius circle
        setCircleGeoJson(createCircleGeoJson(newPoint, CONFIG.map.drone.RADIUS_KM));
        setErrorMessage("");
        return [newPoint];
      } else if (prev.length === 1) {
        // Check if second point is within radius
        const distance = calculateDistance(prev[0], newPoint);
        if (distance <= CONFIG.map.drone.RADIUS_KM) {
          setLineGeoJson(createGeoJsonLine(prev[0], newPoint));
          setErrorMessage("");
          return [...prev, newPoint];
        } else {
          setErrorMessage(`Point must be within ${CONFIG.map.drone.RADIUS_KM}km radius`);
          return prev;
        }
      }
      // Reset and start new selection
      setCircleGeoJson(createCircleGeoJson(newPoint, CONFIG.map.drone.RADIUS_KM));
      setLineGeoJson(null);
      setErrorMessage("");
      return [newPoint];
    });
  };

  const startDroneAnimation = () => {
    if (selectedPoints.length !== 2) return;
    
    const [startPoint, endPoint] = selectedPoints;
    const verticalBearing = calculateVerticalBearing(startPoint, endPoint);
    
    // Initial position centered between points
    const centerLng = (startPoint.longitude + endPoint.longitude) / 2;
    const centerLat = (startPoint.latitude + endPoint.latitude) / 2;
    
    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom: CONFIG.map.drone.INITIAL_ZOOM,
      pitch: 0,
      bearing: viewState.bearing
    });
    
    setIsAnimating(true);
    const startTime = performance.now();
    let rotationComplete = false;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      if (!rotationComplete) {
        // Rotation phase - align line vertically
        const rotationProgress = Math.min(elapsed / CONFIG.map.drone.ROTATION_DURATION, 1);
        const targetBearing = verticalBearing;
        const currentBearing = viewState.bearing + 
          (((targetBearing - viewState.bearing + 180) % 360 - 180) * rotationProgress);
        
        if (rotationProgress === 1) {
          rotationComplete = true;
        }

        setViewState(prev => ({
          ...prev,
          bearing: currentBearing,
          pitch: rotationProgress * CONFIG.map.drone.PITCH,
          zoom: CONFIG.map.drone.INITIAL_ZOOM + 
            (CONFIG.map.drone.FLIGHT_ZOOM - CONFIG.map.drone.INITIAL_ZOOM) * rotationProgress
        }));

        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Flight phase
        const flightElapsed = elapsed - CONFIG.map.drone.ROTATION_DURATION;
        const progress = Math.min(flightElapsed / CONFIG.map.drone.FLIGHT_DURATION, 1);

        const longitude = startPoint.longitude + 
          (endPoint.longitude - startPoint.longitude) * progress;
        const latitude = startPoint.latitude + 
          (endPoint.latitude - startPoint.latitude) * progress;

        if (progress < 1) {
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
          }));
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setSelectedPoints([]);
          setLineGeoJson(null);
          setCircleGeoJson(null);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsAnimating(false);
    setViewState(DEFAULT_VIEW_STATE);
    setSelectedPoints([]);
    setLineGeoJson(null);
    setCircleGeoJson(null);
    setErrorMessage("");
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
        {/* Radius Circle */}
        {circleGeoJson && (
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

        {/* Flight Path Line */}
        {lineGeoJson && (
          <Source type="geojson" data={lineGeoJson}>
            <Layer
              id="line-layer"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Point Markers */}
        {selectedPoints.map((point, index) => (
          <Marker
            key={index}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="center"
          >
            <div className="relative">
              <div 
                className={`w-4 h-4 rounded-full ${
                  index === 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 
                             bg-black/75 text-white px-2 py-1 rounded text-sm">
                Point {index + 1}
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 space-y-2">
        {isAnimating ? (
          <Button
            onClick={cancelAnimation}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Cancel Flight
          </Button>
        ) : (
          <Button
            onClick={startDroneAnimation}
            disabled={selectedPoints.length !== 2}
            className="bg-white text-black hover:bg-gray-100"
          >
            Start Flight
          </Button>
        )}
        
        <div className="text-white bg-black/50 p-2 rounded">
          {errorMessage ? (
            <span className="text-red-400">{errorMessage}</span>
          ) : (
            <>
              {selectedPoints.length === 0 && 'Select start point'}
              {selectedPoints.length === 1 && 'Select end point within yellow circle'}
              {selectedPoints.length === 2 && !isAnimating && 'Ready for flight!'}
              {isAnimating && 'In flight...'}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapboxMap;