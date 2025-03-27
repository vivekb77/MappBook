// components/SetFandomPopup.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiSave, FiAlertCircle } from 'react-icons/fi';

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
  'Mumbai Indians': '#0078D7',
  'Chennai Super Kings': '#FFCC00',
  'Royal Challengers Bengaluru': '#1F1F1F',
  'Kolkata Knight Riders': '#6A0DAD',
  'Delhi Capitals': '#0052CC',
  'Punjab Kings': '#E60023',
  'Rajasthan Royals': '#FF1493',
  'Sunrisers Hyderabad': '#FF5700',
  'Gujarat Titans': '#1DA1F2',
  'Lucknow Super Giants': '#004D98'
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
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [homeHexagon, setHomeHexagon] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
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
            }
            
            if (isValidHexagon) {
              setHomeHexagon(prefs.homeHexagon);
            }
            
            // Only call the parent callback if we have valid data and the callback exists
            if (isValidHexagon && isValidTeam && onTeamSelectRef.current) {
              onTeamSelectRef.current(prefs.homeHexagon.toString(), prefs.team);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved preferences:', error);
        setValidationError('Failed to load your saved preferences. You may need to select again.');
        
        // Reset to safe defaults
        setSelectedTeam('');
        setHomeHexagon(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedPreferences();
  }, []);

  // When a hexagon is selected, update the home hexagon
  useEffect(() => {
    if (selectedHexagon) {
      // When a new hexagon is selected on the map, update our internal state
      setHomeHexagon(selectedHexagon.number);
      
      // Clear any previous validation errors when a new hexagon is selected
      setValidationError('');
    }
  }, [selectedHexagon]);
  
  // Don't render anything if the panel shouldn't be visible
  if (!isVisible) return null;

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
      
      alert("Success! Your team preferences have been saved!");
      onToggleVisibility();
      
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
          alert("Warning: Your preferences were saved to the server but couldn't be saved locally. They may not persist if you close the browser.");
        }
      }
      
    } catch (error) {
      alert("Error: Failed to save your preferences. Please check your connection and try again.");
      console.error('Error saving preferences:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="info-panel">
      <div className="header-row">
        <h2 className="info-panel-title">Set Your IPL Team</h2>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading your preferences...</p>
        </div>
      ) : (
        <>
          {/* Home Hexagon Selection */}
          <div className="row-container">
            <div className="label-container">
              <FiMapPin className="label-icon" />
              <span className="label-text">Your Region:</span>
            </div>
            <span className="value-text">
              {selectedHexagon ? selectedHexagon.number : (homeHexagon ? homeHexagon : 'Click on map to select')}
            </span>
          </div>
          
          {/* Team Selection Dropdown */}
          <div className="dropdown-container">
            <div className="label-container">
              <span className="label-text">Your favorite IPL team:</span>
            </div>
            <select
              className="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select a team</option>
              {IPL_TEAMS.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          
          {/* Validation Error Message */}
          {validationError && (
            <div className="error-container">
              <FiAlertCircle className="error-icon" />
              <span className="error-text">{validationError}</span>
            </div>
          )}
          
          {/* Save Button */}
          <button 
            className="save-button"
            style={{ backgroundColor: selectedTeam ? getTeamColor() : '#1A5D1A' }}
            onClick={saveUserPreferences}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="small-spinner"></div>
            ) : (
              <>
                <FiSave className="button-icon" />
                <span>Save</span>
              </>
            )}
          </button>
        </>
      )}

      <style jsx>{`
        .info-panel {
          position: fixed;
          bottom: 80px;
          left: 20px;
          background-color: white;
          border-radius: 12px;
          padding: 16px;
          min-width: 280px;
          max-width: 320px;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
          z-index: 1000;
        }
        .header-row {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }
        .header-icon {
          margin-right: 8px;
          color: #1A5D1A;
        }
        .info-panel-title {
          font-size: 18px;
          font-weight: bold;
          color: #1A5D1A;
          text-align: center;
          margin: 0;
        }
        .row-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }
        .label-container {
          display: flex;
          align-items: center;
          flex: 2;
        }
        .label-icon {
          margin-right: 6px;
          color: #1A5D1A;
        }
        .label-text {
          font-size: 15px;
          color: #333;
        }
        .value-text {
          font-size: 16px;
          font-weight: bold;
          color: #1A5D1A;
          flex: 1;
          text-align: right;
        }
        .dropdown-container {
          margin-bottom: 20px;
          width: 100%;
        }
        .team-select {
          margin-top: 8px;
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f8f8f8;
          font-size: 15px;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231A5D1A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
        }
        .button-icon {
          margin-right: 8px;
        }
        .save-button {
          background-color: #1A5D1A;
          color: white;
          padding: 12px;
          border-radius: 8px;
          border: none;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.2s;
        }
        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .save-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        .error-container {
          display: flex;
          align-items: center;
          background-color: #FFEBEE;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .error-icon {
          margin-right: 6px;
          color: #E60023;
        }
        .error-text {
          color: #E60023;
          font-size: 14px;
          flex: 1;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .loading-text {
          margin-top: 12px;
          color: #1A5D1A;
          font-size: 16px;
          font-weight: 500;
        }
        .spinner {
          border: 3px solid rgba(26, 93, 26, 0.3);
          border-radius: 50%;
          border-top: 3px solid #1A5D1A;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        .small-spinner {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 2px solid white;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .info-panel {
            bottom: 70px;
            left: 10px;
            min-width: 260px;
            max-width: 300px;
            padding: 12px;
          }
          .header-row {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .info-panel-title {
            font-size: 16px;
          }
          .row-container {
            margin-bottom: 12px;
            padding-bottom: 8px;
          }
          .label-text {
            font-size: 14px;
          }
          .value-text {
            font-size: 14px;
          }
          .team-select {
            padding: 6px 10px;
            font-size: 14px;
          }
          .save-button {
            padding: 10px;
            font-size: 14px;
          }
        }

        @media (max-width: 480px) {
          .info-panel {
            bottom: 60px;
            left: 5px;
            right: 5px;
            max-width: calc(100% - 10px);
            width: calc(100% - 10px);
          }
          .header-icon {
            font-size: 14px;
          }
          .info-panel-title {
            font-size: 15px;
          }
          .label-container {
            flex: 1.5;
          }
          .label-text {
            font-size: 13px;
          }
          .value-text {
            font-size: 13px;
          }
          .loading-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default SetFandomPopup;