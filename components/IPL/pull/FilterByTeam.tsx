// components/FilterByTeams.tsx
import React, { useState, useEffect } from 'react';

interface FilterByTeamsProps {
  showModal: boolean;
  onClose: () => void;
  selectedTeams: string[];
  onSelectTeam: (team: string) => void;
  onResetFilters: () => void;
}

const FilterByTeams: React.FC<FilterByTeamsProps> = ({
  showModal,
  onClose,
  selectedTeams: initialSelectedTeams,
  onSelectTeam,
  onResetFilters
}) => {
  if (!showModal) return null;

  // Maintain internal state for selected teams
  const [localSelectedTeams, setLocalSelectedTeams] = useState<string[]>([...initialSelectedTeams]);

  // Update local state when props change
  useEffect(() => {
    setLocalSelectedTeams([...initialSelectedTeams]);
  }, [initialSelectedTeams]);

  // Team colors for the IPL teams
  const teamColors = {
    'Chennai Super Kings': '#FFDC00',     // Yellow
    'Mumbai Indians': '#00305a',         // Deep blue with light blue accent
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Kolkata Knight Riders': '#552583',   // Purple
    'Delhi Capitals': '#0033A0',         // Red with navy blue accent
    'Punjab Kings': '#ED1B24',            // Red
    'Sunrisers Hyderabad': '#FF6500',     // Orange,
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
  };

  // Get all team names
  const teamNames = Object.keys(teamColors);

  const handleTeamSelection = (team: string) => {
    // If team is already selected, remove it
    if (localSelectedTeams.includes(team)) {
      setLocalSelectedTeams(localSelectedTeams.filter(t => t !== team));
      return;
    }
    
    // Otherwise, add the team (with no limit)
    setLocalSelectedTeams([...localSelectedTeams, team]);
  };

  // Enable apply button if at least 1 team is selected
  const canApply = localSelectedTeams.length >= 1;

  // Custom reset to ensure we start with 0 teams
  const handleReset = () => {
    setLocalSelectedTeams([]);
    onResetFilters();
  };

  // Apply the filters
  const handleApply = () => {
    // First, remove any teams that were deselected
    const teamsToRemove = initialSelectedTeams.filter(team => !localSelectedTeams.includes(team));
    teamsToRemove.forEach(team => onSelectTeam(team));
    
    // Then, add any teams that were newly selected
    const teamsToAdd = localSelectedTeams.filter(team => !initialSelectedTeams.includes(team));
    teamsToAdd.forEach(team => onSelectTeam(team));
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 mx-4 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Select Teams to Compare</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Team list */}
        <div className="overflow-y-auto max-h-80 mb-6">
          {teamNames.map((team) => {
            const isSelected = localSelectedTeams.includes(team);
            const teamColor = teamColors[team as keyof typeof teamColors];
            
            return (
              <div 
                key={team} 
                className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border border-blue-100' : ''}`}
                onClick={() => handleTeamSelection(team)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-full mr-3" 
                    style={{ backgroundColor: teamColor }} 
                  />
                  <span className={`${isSelected ? 'font-bold' : ''}`}>{team}</span>
                </div>
                <div className={`w-5 h-5 border rounded flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                  {isSelected && (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current selection */}
        <div className="text-sm font-medium text-gray-700 mb-4">
          Selected: {localSelectedTeams.length === 0 ? "No teams selected" : localSelectedTeams.join(" vs ")}
          {localSelectedTeams.length === 0 && (
            <p className="text-red-500 mt-1">Please select at least 1 team</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              canApply 
                ? 'bg-green-700 text-white hover:bg-green-800' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterByTeams;