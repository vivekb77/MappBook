"use client"
import React from 'react';

interface TeamDistribution {
  team: string;
  count: number;
  percentage: number;
}

interface MapData {
  success: boolean;
  data: {
    hexagons: any[];
    metadata: {
      total_fans: number;
      updated_at: string;
      total_hexagons: number;
    };
    global_team_distribution: TeamDistribution[];
  };
  timestamp: string;
}

interface TeamDistributionModalProps {
  showModal: boolean;
  onClose: () => void;
  mapData: MapData | null;
}

const TeamDistributionModal: React.FC<TeamDistributionModalProps> = ({ 
  showModal, 
  onClose,
  mapData 
}) => {
  if (!showModal) return null;

  // Team colors mapping
  const teamColors: { [key: string]: string } = {
    'Chennai Super Kings': '#FFDC00',
    'Delhi Capitals': '#0033A0',
    'Gujarat Titans': '#39B6FF',
    'Kolkata Knight Riders': '#552583',
    'Lucknow Super Giants': '#005CB9',
    'Mumbai Indians': '#004C93',
    'Punjab Kings': '#ED1B24',
    'Rajasthan Royals': '#FF69B4',
    'Royal Challengers Bengaluru': '#2B2A29',
    'Sunrisers Hyderabad': '#FF6500'
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800">IPL Team Fandom Distribution</h2>
          </div>
          <button 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {mapData ? (
            <div>
              {/* <h3 className="text-center text-xl font-bold mb-4">Who fans support in IPL 2025</h3> */}
              <div className="space-y-3">
                {mapData.data.global_team_distribution.map((item, index) => {
                  const color = teamColors[item.team] || '#cccccc';
                  const maxCount = Math.max(...mapData.data.global_team_distribution.map(i => i.count));
                  const barWidth = (item.count / maxCount) * 100;
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">{item.team}</span>
                        <span className="text-gray-700">
                          {item.count.toLocaleString()} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDistributionModal;