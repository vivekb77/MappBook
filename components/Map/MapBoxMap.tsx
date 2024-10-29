import React, { useContext, useEffect, useRef, useState, useMemo } from "react";
import { Map, MapRef, MapLayerMouseEvent, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import MarkSearchedPlace from "./MarkSearchedPlace";
import MarkAllPlaces from "./MarkAllPlaces";
import MapStatsOverlay from "./MapStatsOverlay";
import { SearchedPlaceDetailsContext } from "@/context/SearchedPlaceDetailsContext";

// Types remain the same
interface MapboxMapProps {
  className?: string;
  defaultStyle?: "satellite" | "light" | "dark" | "custom";
}

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

interface PlaceDetails {
  longitude: number;
  latitude: number;
  mapboxId: string;
  name: string;
  address: string;
  country: string;
  countryCode: string;
  language: string;
  poiCategory?: string;
  maki?: string;
}

interface SearchedPlaceContextType {
  searchedPlace?: PlaceDetails;
  setSearchedPlaceDetails: (details: PlaceDetails) => void;
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

  const { searchedPlace } = useContext(SearchedPlaceDetailsContext) as SearchedPlaceContextType;
  const mapStyle = useMemo(() => MAP_STYLES[defaultStyle], [defaultStyle]);


  
  const isValidCoordinates = (place: PlaceDetails | undefined): place is PlaceDetails => {
    if (!place) return false;
    
    return (
      typeof place.latitude === 'number' && 
      typeof place.longitude === 'number' &&
      !isNaN(place.latitude) && 
      !isNaN(place.longitude) &&
      Object.keys(place).length > 0 &&
      place.latitude !== 0 && 
      place.longitude !== 0
    );
  };

  const handleMapLoad = () => {
    setIsLoading(false);
  };

  const handleMapError = (e: any) => {
    setError("Failed to load map. Please check your connection and try again.");
    setIsLoading(false);
  };

  useEffect(() => {
    if (isValidCoordinates(searchedPlace) && mapRef.current) {
      const { longitude, latitude } = searchedPlace;

      mapRef.current.flyTo({
        center: [longitude, latitude],
        duration: 2000,
        zoom: 14,
        pitch: 45,
        bearing: 0,
        curve: 1.5,
        easing: (t: number) => t * (2 - t),
        essential: true,
      });

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

  const handleMapClick = (event: MapLayerMouseEvent) => {
    const { lngLat } = event;
    // Handle map click if needed
  };

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
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="absolute top-10 left-4 right-4 z-1">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        initialViewState={DEFAULT_VIEW_STATE}
        {...viewState}
        onMove={handleViewStateChange}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapStyle={mapStyle}
        reuseMaps
        attributionControl={false}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        style={{ width: '100%', height: '100%' }}
      >
        <MarkAllPlaces />
        <MapStatsOverlay />
        <MarkSearchedPlace />
      </Map>
    </div>
  );
};

export default React.memo(MapboxMap);