// utils/MapLogic.ts
// Contains geographical calculations and utility functions for the map

export interface ViewBox {
    width: number;
    height: number;
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  }
  
  export interface Feature {
    geometry: {
      type: string;
      coordinates: any[];
    };
    properties: Record<string, any>;
  }
  
  export interface GeoJSON {
    type: string;
    features: Feature[];
  }
  
  export interface Hexagon {
    id: string;
    number: number;
    points: string;
    centerX: number;
    centerY: number;
  }
  
  // Calculate viewbox dimensions from GeoJSON data
  export const calculateViewBox = (geoJson: GeoJSON): ViewBox => {
    try {
      // Start with reasonable defaults for India
      let minLon = 68;  // Approximate western boundary of India
      let maxLon = 97;  // Approximate eastern boundary of India
      let minLat = 8;   // Approximate southern boundary of India
      let maxLat = 37;  // Approximate northern boundary of India
  
      // Update with actual data if available
      geoJson.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((point: string | any[]) => {
            if (Array.isArray(point) && point.length >= 2 &&
              isFinite(point[0]) && isFinite(point[1])) {
              minLon = Math.min(minLon, point[0]);
              maxLon = Math.max(maxLon, point[0]);
              minLat = Math.min(minLat, point[1]);
              maxLat = Math.max(maxLat, point[1]);
            }
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(polygon => {
            polygon[0].forEach((point: string | any[]) => {
              if (Array.isArray(point) && point.length >= 2 &&
                isFinite(point[0]) && isFinite(point[1])) {
                minLon = Math.min(minLon, point[0]);
                maxLon = Math.max(maxLon, point[0]);
                minLat = Math.min(minLat, point[1]);
                maxLat = Math.max(maxLat, point[1]);
              }
            });
          });
        }
      });
  
      // Add some padding
      const lonPadding = (maxLon - minLon) * 0.05;
      const latPadding = (maxLat - minLat) * 0.05;
  
      // Calculate width based on screen size
      let mapWidth = 900;
  
      if (typeof window !== 'undefined') {
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) {
          mapWidth = screenWidth * 0.95;
        } else if (screenWidth < 1200) {
          mapWidth = screenWidth * 0.9;
        } else {
          mapWidth = Math.min(screenWidth * 0.85, 1400);
        }
      }
  
      // Calculate height based on the geographical aspect ratio
      const geoAspectRatio = (maxLat - minLat) / (maxLon - minLon);
      const mapHeight = mapWidth * geoAspectRatio;
  
      return {
        minLon: minLon - lonPadding,
        maxLon: maxLon + lonPadding,
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding,
        width: mapWidth,
        height: mapHeight
      };
    } catch (error) {
      console.error('Error calculating viewbox:', error);
  
      // Fallback to default values
      return {
        minLon: 68,
        maxLon: 97,
        minLat: 8,
        maxLat: 37,
        width: 900,
        height: 800
      };
    }
  };
  
  // Function to check if a point is inside a polygon using ray casting algorithm
  export const isPointInPolygon = (lon: number, lat: number, polygon: number[][]): boolean => {
    if (!polygon || !Array.isArray(polygon)) return false;
  
    try {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
  
        // Skip invalid coordinates
        if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) {
          continue;
        }
  
        const intersect = ((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    } catch (error) {
      console.error('Error in point-in-polygon algorithm:', error);
      return false;
    }
  };
  
  // Function to check if a point is inside any polygon in the GeoJSON data
  export const isPointInsideIndia = (lon: number, lat: number, geoJson: GeoJSON): boolean => {
    if (!geoJson || !geoJson.features) return false;
  
    try {
      for (const feature of geoJson.features) {
        if (feature.geometry.type === 'Polygon') {
          if (isPointInPolygon(lon, lat, feature.geometry.coordinates[0])) {
            return true;
          }
        } else if (feature.geometry.type === 'MultiPolygon') {
          for (const polygon of feature.geometry.coordinates) {
            if (isPointInPolygon(lon, lat, polygon[0])) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in point-in-India check:', error);
    }
  
    return false;
  };
  
  // Convert GeoJSON coordinates to SVG path
  export const coordinatesToPath = (coordinates: number[][][], viewBox: ViewBox): string => {
    if (!coordinates || !coordinates.length || !coordinates[0] || !coordinates[0].length) {
      return '';
    }
  
    try {
      const polygons = coordinates.map(polygon => {
        const points = polygon.map(point => {
          // Skip invalid or infinite coordinates
          if (!Array.isArray(point) || point.length < 2 ||
            !isFinite(point[0]) || !isFinite(point[1]) ||
            point[0] === null || point[1] === null) {
            return null;
          }
  
          const x = ((point[0] - viewBox.minLon) / (viewBox.maxLon - viewBox.minLon)) * viewBox.width;
          const y = viewBox.height - ((point[1] - viewBox.minLat) / (viewBox.maxLat - viewBox.minLat)) * viewBox.height;
  
          // Ensure x and y are valid numbers
          if (!isFinite(x) || !isFinite(y)) {
            return null;
          }
  
          return `${x},${y}`;
        }).filter(Boolean); // Remove null points
  
        if (points.length === 0) return '';
  
        return `M${points.join(' L')}Z`;
      }).filter(path => path !== '');
  
      return polygons.join(' ');
    } catch (error) {
      console.error('Error converting coordinates to path:', error);
      return '';
    }
  };