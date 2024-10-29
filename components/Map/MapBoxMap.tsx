import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Map, MapRef, MapLayerMouseEvent, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import MapStatsOverlay from "./MapStatsOverlay";
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";



// Types
interface MapboxMapProps {
  className?: string;
  defaultStyle?: "satellite" | "light" | "dark" | "custom";
}

// Using a partial ViewState for our internal state management
interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const MAP_STYLES = {
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  custom: "mapbox://styles/newsexpressnz/cm2oewdbb002p01pwb1epbr8l",
};

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: -114.370789,
  latitude: 46.342303,
  zoom: 1,
  pitch: 0,
  bearing: 0,
};

const MapboxMap: React.FC<MapboxMapProps> = ({
  className = "",
  defaultStyle = "satellite"
}) => {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);

  const { searchedPlace, setsoruceCordinates } = useContext(SearchedPlaceDetailsContext);

  // Memoize the map style to prevent unnecessary rerenders
  const mapStyle = useMemo(() => MAP_STYLES[defaultStyle], [defaultStyle]);

  // Handle map loading and errors
  const handleMapLoad = () => {
    setIsLoading(false);
  };

  const handleMapError = (e: any) => {
    setError("Failed to load map. Please check your connection and try again.");
    setIsLoading(false);
  };

  // Fly to searched place with enhanced animation
  useEffect(() => {
    if (searchedPlace && mapRef.current) {
      const { longitude, latitude } = searchedPlace;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: 14,
        pitch: 45, // Add some tilt for a more dynamic view
        bearing: 0,
        curve: 1.5,
        easing: (t: number) => t * (2 - t),
        essential: true,
      });

      // Update view state after animation
      setViewState(prev => ({
        ...prev,
        longitude,
        latitude,
        zoom: 14,
        pitch: 45,
        bearing: 0,
      }));
    }
  }, [searchedPlace]);

  // Handle click events on the map
  const handleMapClick = (event: MapLayerMouseEvent) => {
    const { lngLat } = event;
    setsoruceCordinates?.(lngLat);
  };

  // Handle view state changes
  const handleViewStateChange = (evt: { viewState: ViewState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = evt.viewState;
    setViewState({
      longitude,
      latitude,
      zoom,
      pitch,
      bearing,
    });
  };



  return (
    <div className={`p-5 bg-gray-50 min-h-screen flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Map Container */}
        <div className="h-[50vh] md:h-[80vh]">
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
            initialViewState={DEFAULT_VIEW_STATE}
            {...viewState} // Spread the view state directly
            onMove={handleViewStateChange}
            onClick={handleMapClick}
            onLoad={handleMapLoad}
            onError={handleMapError}
            mapStyle={mapStyle}
            reuseMaps
            attributionControl={false}
            terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
          >
            <MarkAllPlaces />
            <MapStatsOverlay />
            <MarkSearchedPlace />
          </Map>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MapboxMap);

function setClerkUserId(id: string) {
  throw new Error("Function not implemented.");
}
