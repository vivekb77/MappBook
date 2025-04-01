// components/FilterByTeams.tsx
import React, { useEffect } from 'react';

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
  selectedTeams,
  onSelectTeam,
  onResetFilters
}) => {
  if (!showModal) return null;

  // Team colors for the IPL teams
  const teamColors = {
   'Chennai Super Kings': '#FFDC00',     // Yellow
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Kolkata Knight Riders': '#552583',   // Purple
    'Punjab Kings': '#ED1B24',            // Red
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Sunrisers Hyderabad': '#FF6500',     // Orange,
    'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
    'Mumbai Indians': '#00305a',         // Deep blue with light blue accent
    'Delhi Capitals': '#0033A0',         // Red with navy blue accent
  };

  // Get all team names
  const teamNames = Object.keys(teamColors);

  const handleTeamSelection = (team: string) => {
    // If team is already selected, remove it
    if (selectedTeams.includes(team)) {
      onSelectTeam(team); // This will call the parent's handler to remove the team
      return;
    }
    
    // If less than 2 teams are selected, add this team
    if (selectedTeams.length < 2) {
      onSelectTeam(team); // This will call the parent's handler to add the team
      return;
    }
    
    // If 2 teams are already selected, replace the oldest selection with the new one
    // (Remove the first team in the array and add the new one)
    const updatedTeams = [...selectedTeams];
    updatedTeams.shift(); // Remove the first (oldest) team
    
    // First remove the shifted team
    onSelectTeam(selectedTeams[0]);
    
    // Then add the new team
    onSelectTeam(team);
  };

  // Disable apply button if not exactly 2 teams are selected
  const canApply = selectedTeams.length === 2;

  // Custom reset to ensure we start with 0 teams
  const handleReset = () => {
    onResetFilters();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-6 mx-4 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Select 2 Teams to Compare</h2>
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
            const isSelected = selectedTeams.includes(team);
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
          Selected: {selectedTeams.length === 0 ? "No teams selected" : selectedTeams.join(" vs ")}
          {selectedTeams.length !== 2 && (
            <p className="text-red-500 mt-1">Please select 2 teams</p>
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
            onClick={onClose}
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