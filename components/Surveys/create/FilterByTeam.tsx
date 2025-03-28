// components/FilterByTeams.tsx
import React from 'react';

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
    'Delhi Capitals': '#0033A0',          // Blue
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Kolkata Knight Riders': '#552583',   // Purple
    'Lucknow Super Giants': '#005CB9',    // Royal Blue
    'Mumbai Indians': '#004C93',          // Blue
    'Punjab Kings': '#ED1B24',            // Red
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Sunrisers Hyderabad': '#FF6500'      // Orange
  };

  // Get all team names
  const teamNames = Object.keys(teamColors);

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

        <p className="text-sm text-gray-600 mb-4">
          Select up to 2 teams to filter the map
        </p>

        {/* Team list */}
        <div className="overflow-y-auto max-h-80 mb-6">
          {teamNames.map((team) => {
            const isSelected = selectedTeams.includes(team);
            const teamColor = teamColors[team as keyof typeof teamColors];
            
            return (
              <div 
                key={team} 
                className={`flex items-center justify-between p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border border-blue-100' : ''}`}
                onClick={() => onSelectTeam(team)}
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
          Current selection: {selectedTeams.length === 0 ? "No teams selected" : selectedTeams.join(" vs ")}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onResetFilters}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterByTeams;