// components/SetFandomPopup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiSave, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import SuccessNotification from './SaveTeamNotification';
import { useTeam } from '../../IPL/TeamContext'; // Import the team context hook

// TypeScript interfaces
interface Hexagon {
  id: string;
  number: number;
  points: string;
  centerX: number;
  centerY: number;
}

interface SetFandomPopupProps {
  selectedHexagon: Hexagon | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
  userId: string;
  onTeamSelect: (hexagon: string, team: string) => void;
}

interface StoredPreferences {
  homeHexagon: number;
  team: string;
  lastUpdated: string;
  version: number;
}

// IPL teams array
const IPL_TEAMS = [
  'Mumbai Indians',
  'Chennai Super Kings',
  'Royal Challengers Bengaluru',
  'Kolkata Knight Riders',
  'Delhi Capitals',
  'Punjab Kings',
  'Rajasthan Royals',
  'Sunrisers Hyderabad',
  'Gujarat Titans',
  'Lucknow Super Giants'
];

// Team colors for the IPL teams
const TEAM_COLORS: Record<string, string> = {
  'Chennai Super Kings': '#FFDC00',     // Yellow
  'Gujarat Titans': '#39B6FF',          // Light Blue
  'Kolkata Knight Riders': '#552583',   // Purple
  'Punjab Kings': '#ED1B24',            // Red
  'Rajasthan Royals': '#FF69B4',        // Pink
  'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
  'Sunrisers Hyderabad': '#FF6500',     // Orange,
  'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
  'Mumbai Indians': '#00305a',         // Deep blue with light blue accent
  'Delhi Capitals': '#0033A0',         // Red with navy blue accen
};

// Storage constants
const STORAGE_KEY = 'userTeamPreference';
const STORAGE_VERSION = 1;

const SetFandomPopup: React.FC<SetFandomPopupProps> = ({
  selectedHexagon,
  isVisible,
  onToggleVisibility,
  userId,
  onTeamSelect
}) => {
  // Get the team context
  const { setTeamData } = useTeam();
  
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [homeHexagon, setHomeHexagon] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [isDataChanged, setIsDataChanged] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  
  // Original data reference to check if the data has been changed
  const originalDataRef = useRef<{team: string, hexagon: number | null}>({
    team: '',
    hexagon: null
  });

  // Use ref to store the callback to avoid dependency issues
  const onTeamSelectRef = useRef(onTeamSelect);

  // Update the ref when the prop changes
  useEffect(() => {
    onTeamSelectRef.current = onTeamSelect;
  }, [onTeamSelect]);

  // Load previously saved preferences when component mounts
  useEffect(() => {
    const loadSavedPreferences = async () => {
      setIsLoading(true);
      try {
        if (typeof window !== 'undefined') {
          const savedPrefs = localStorage.getItem(STORAGE_KEY);
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs) as StoredPreferences;

            // Validate the data
            const isValidTeam = prefs.team && IPL_TEAMS.includes(prefs.team);
            const isValidHexagon = prefs.homeHexagon && Number.isInteger(prefs.homeHexagon);

            // Check version for future migrations
            const version = prefs.version || 1;

            // Only update state if data is valid
            if (isValidTeam) {
              setSelectedTeam(prefs.team);
              originalDataRef.current.team = prefs.team;
            }

            if (isValidHexagon) {
              setHomeHexagon(prefs.homeHexagon);
              originalDataRef.current.hexagon = prefs.homeHexagon;
            }

            // Only call the parent callback if we have valid data and the callback exists
            if (isValidHexagon && isValidTeam && onTeamSelectRef.current) {
              onTeamSelectRef.current(prefs.homeHexagon.toString(), prefs.team);
              
              // Update the global context with team data
              setTeamData(prefs.team, prefs.homeHexagon);
              
              setIsSaved(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved preferences:', error);
        setValidationError('Failed to load your saved preferences. You may need to select again.');

        // Reset to safe defaults
        setSelectedTeam('');
        setHomeHexagon(null);
        originalDataRef.current = { team: '', hexagon: null };
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedPreferences();
  }, [setTeamData]);

  // When a hexagon is selected, update the home hexagon
  useEffect(() => {
    if (selectedHexagon) {
      // When a new hexagon is selected on the map, update our internal state
      setHomeHexagon(selectedHexagon.number);

      // Clear any previous validation errors when a new hexagon is selected
      setValidationError('');
      
      // Check if data has changed
      checkIfDataChanged(selectedTeam, selectedHexagon.number);
    }
  }, [selectedHexagon, selectedTeam]);

  // Check if data is changed when team selection changes
  useEffect(() => {
    const hexagonToCheck = selectedHexagon ? selectedHexagon.number : homeHexagon;
    checkIfDataChanged(selectedTeam, hexagonToCheck);
  }, [selectedTeam, homeHexagon, selectedHexagon]);

  // Function to check if the data has been changed from original/saved values
  const checkIfDataChanged = (team: string, hexagon: number | null) => {
    if (team !== originalDataRef.current.team || hexagon !== originalDataRef.current.hexagon) {
      setIsDataChanged(true);
      // If data is changed, we need to save before showing results
      setIsSaved(false);
    } else {
      setIsDataChanged(false);
    }
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setShowSuccessNotification(false);
    // Removed onToggleVisibility call to keep the panel visible after saving
  };

  // Function to hide panel when user clicks on "Click on map to select"
  const handleSelectOnMap = () => {
    onToggleVisibility();
  };

  // Get the appropriate color for the selected team or default to cricket green
  const getTeamColor = (): string => {
    return selectedTeam ? TEAM_COLORS[selectedTeam] || '#1A5D1A' : '#1A5D1A';
  };

  // Function to send data to backend API
  const saveUserPreferences = async () => {
    // Reset validation error
    setValidationError('');

    // Get the hexagon number to save - prioritize the current selection from parent
    const hexagonToSave = selectedHexagon ? selectedHexagon.number : homeHexagon;

    // Validate input
    if (!hexagonToSave) {
      setValidationError('Please select a hexagon on the map first');
      return;
    }

    if (!selectedTeam) {
      setValidationError('Please select your favorite team');
      return;
    }

    // Validate the team is in our list
    if (!IPL_TEAMS.includes(selectedTeam)) {
      setValidationError('Please select a valid team from the list');
      return;
    }

    // Check if we have a user ID
    if (!userId) {
      setValidationError('User ID not available. Please reload the page.');
      return;
    }

    try {
      setIsSubmitting(true);

      // API call
      const response = await fetch('/api/set-survey-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: userId,
          homeHexagon: hexagonToSave,
          team: selectedTeam,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      // Success
      // Only now do we update the parent component with the new values
      if (onTeamSelectRef.current) {
        onTeamSelectRef.current(hexagonToSave.toString(), selectedTeam);
      }

      // Update our internal hexagon state to match what we've saved
      setHomeHexagon(hexagonToSave);
      
      // Update original data reference
      originalDataRef.current = {
        team: selectedTeam,
        hexagon: hexagonToSave
      };
      
      // Mark as saved and no longer changed
      setIsSaved(true);
      setIsDataChanged(false);
      
      // Update the global context with the selected team and hexagon
      setTeamData(selectedTeam, hexagonToSave);

      // Show success notification instead of alert
      setShowSuccessNotification(true);

      // Save the preferences locally as well for backup/offline use
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            homeHexagon: hexagonToSave,
            team: selectedTeam,
            lastUpdated: new Date().toISOString(),
            version: STORAGE_VERSION
          }));
        } catch (storageError) {
          console.error('Failed to save preferences locally:', storageError);
          setValidationError("Warning: Your preferences were saved to the server but couldn't be saved locally. They may not persist if you close the browser.");
        }
      }

    } catch (error) {
      setValidationError("Error: Failed to save your preferences. Please check your connection and try again.");
      console.error('Error saving preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if the panel shouldn't be visible
  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-20 left-5 bg-white rounded-xl p-4 min-w-[280px] max-w-[320px] shadow-md z-50">
        <div className="flex justify-center items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-green-800 text-center m-0">Set Your IPL Team</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="w-8 h-8 border-3 border-green-800/30 border-t-green-800 rounded-full animate-spin"></div>
            <p className="mt-3 text-green-800 text-base font-medium">Loading your preferences</p>
          </div>
        ) : (
          <>
            {/* Home Hexagon Selection */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center flex-2">
                <FiMapPin className="mr-1.5 text-green-800" />
                <span className="text-sm text-gray-800">Your Region:</span>
              </div>
              {selectedHexagon || homeHexagon ? (
                <span className="text-base font-bold text-green-800 flex-1 text-right">
                  {selectedHexagon ? selectedHexagon.number : homeHexagon}
                </span>
              ) : (
                <button 
                  onClick={handleSelectOnMap} 
                  className="text-base font-bold text-blue-600 flex-1 text-right border-none bg-transparent cursor-pointer hover:text-blue-800"
                >
                  Click on map to select
                </button>
              )}
            </div>

            {/* Team Selection Dropdown */}
            <div className="mb-5 w-full">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 mr-2" style={{
                  backgroundColor: selectedTeam ? TEAM_COLORS[selectedTeam] : '#1A5D1A',
                  borderRadius: '50%'
                }}></div>
                <span className="text-sm font-medium text-gray-800">Your favorite IPL team:</span>
              </div>
              <div className="relative">
                <select
                  className="mt-1 w-full p-3 pl-4 border border-gray-300 rounded-lg shadow-sm bg-white text-base font-medium appearance-none transition-all hover:border-green-700 focus:border-green-800 focus:ring-2 focus:ring-green-800 focus:ring-opacity-20 focus:outline-none"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  style={{
                    borderColor: selectedTeam ? TEAM_COLORS[selectedTeam] : '#d1d5db',
                    borderLeftWidth: selectedTeam ? '4px' : '1px'
                  }}
                >
                  <option value="" disabled className="text-gray-500 font-medium">Select team</option>
                  {IPL_TEAMS.map((team) => (
                    <option key={team} value={team} style={{
                      fontWeight: '500',
                      padding: '8px'
                    }}>{team}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={selectedTeam ? TEAM_COLORS[selectedTeam] : '#1A5D1A'}>
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="flex items-center bg-red-50 p-2.5 rounded-lg mb-3">
                <FiAlertCircle className="mr-1.5 text-red-600" />
                <span className="text-red-600 text-sm flex-1">{validationError}</span>
              </div>
            )}

            {/* Data Changed Message */}
            {isDataChanged && !validationError && (
              <div className="flex items-center bg-yellow-50 p-2.5 rounded-lg mb-3">
                <FiAlertCircle className="mr-1.5 text-yellow-600" />
                <span className="text-yellow-600 text-sm flex-1">Please save before viewing results.</span>
              </div>
            )}

            {/* Save Button */}
            <button
              className="bg-green-800 text-white p-3 rounded-lg border-none w-full flex items-center justify-center text-base font-semibold cursor-pointer mt-2 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: selectedTeam ? getTeamColor() : '#1A5D1A' }}
              onClick={saveUserPreferences}
              disabled={isSubmitting || (!isDataChanged && isSaved)}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  <span>{(!isDataChanged && isSaved) ? 'Saved' : 'Save'}</span>
                </>
              )}
            </button>
            
            {/* See Results Button */}
            <div className="mt-3">
              {(isSaved && !isDataChanged) ? (
                <Link href="/ipl-fandom-map" passHref>
                  <button 
                    className="bg-white text-green-800 hover:bg-gray-100 p-3 rounded-lg border border-gray-300 w-full flex items-center justify-center text-base font-semibold cursor-pointer transition-all"
                    style={{ color: selectedTeam ? getTeamColor() : '#1A5D1A' }}
                    aria-label="See fandom map results"
                  >
                    <span>See Results</span>
                  </button>
                </Link>
              ) : (
                <button 
                  className="bg-gray-100 text-gray-400 p-3 rounded-lg border border-gray-200 w-full flex items-center justify-center text-base font-semibold cursor-not-allowed opacity-70 transition-all"
                  disabled
                  aria-label="Save your preferences first to see results"
                >
                  <span>Save to See Results</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Success Notification */}
      <SuccessNotification
        message="Saved!"
        isVisible={showSuccessNotification}
        onClose={handleNotificationClose}
        duration={2000}
      />
    </>
  );
};

export default SetFandomPopup;