"use client";
import React, { createContext, useState, useContext } from 'react';

interface MapStatsContextType {
  visitedPlacesCount: number;
  wantToVisitPlacesCount: number;
  visitedCountriesCount: number;
  allPlacesCount: number;
  setVisitedPlacesCount: (count: number) => void;
  setWantToVisitPlacesCount: (count: number) => void;
  setVisitedCountriesCount: (count: number) => void;
  setAllPlacesCount: (count: number) => void;
}

const defaultContext: MapStatsContextType = {
  visitedPlacesCount: 0,
  wantToVisitPlacesCount: 0,
  visitedCountriesCount: 0,
  allPlacesCount: 0,
  setVisitedPlacesCount: () => {},
  setWantToVisitPlacesCount: () => {},
  setVisitedCountriesCount: () => {},
  setAllPlacesCount: () => {},
};

export const MapStatsContext = createContext<MapStatsContextType>(defaultContext);

export const MapStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visitedPlacesCount, setVisitedPlacesCount] = useState(0);
  const [wantToVisitPlacesCount, setWantToVisitPlacesCount] = useState(0);
  const [visitedCountriesCount, setVisitedCountriesCount] = useState(0);
  const [allPlacesCount, setAllPlacesCount] = useState(0);

  const value = {
    visitedPlacesCount,
    wantToVisitPlacesCount,
    visitedCountriesCount,
    allPlacesCount,
    setVisitedPlacesCount,
    setWantToVisitPlacesCount,
    setVisitedCountriesCount,
    setAllPlacesCount,
  };

  return (
    <MapStatsContext.Provider value={value}>
      {children}
    </MapStatsContext.Provider>
  );
};
