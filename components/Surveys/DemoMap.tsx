import React, { useState, useEffect } from 'react';
import { MapPin, Info, BarChart, ChevronDown, Filter } from 'lucide-react';

// Demo component for the landing page
const SurveyMapDemo = () => {
  const [activeSurvey, setActiveSurvey] = useState('consumer-preferences');
  const [selectedHexagon, setSelectedHexagon] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All Responses');

  // Sample hex data for visualization
  const hexagons = generateHexGrid(20, 12);

  function generateHexGrid(cols, rows) {
    const hexArray = [];
    const hexSize = 30;
    const offsetX = hexSize * Math.sqrt(3);
    const offsetY = hexSize * 1.5;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isOddRow = r % 2 === 1;
        const x = c * offsetX + (isOddRow ? offsetX / 2 : 0);
        const y = r * offsetY;
        
        // Only add hexagons that would reasonably be within a country shape
        // This is a simplistic approach to create an irregular shape
        const distFromCenter = Math.sqrt(
          Math.pow((x - (cols * offsetX / 2)) / (cols * offsetX / 2), 2) + 
          Math.pow((y - (rows * offsetY / 2)) / (rows * offsetY / 2), 2)
        );
        
        if (distFromCenter < 0.8 + Math.random() * 0.2) {
          hexArray.push({
            id: `hex-${r}-${c}`,
            x,
            y,
            value: Math.random(),
            responseDist: {
              option1: Math.floor(Math.random() * 100),
              option2: Math.floor(Math.random() * 100),
              option3: Math.floor(Math.random() * 80),
              option4: Math.floor(Math.random() * 50)
            }
          });
        }
      }
    }
    
    return hexArray;
  }

  // Get color based on value
  const getColor = (value) => {
    if (activeSurvey === 'consumer-preferences') {
      return `rgba(52, 211, 153, ${0.2 + value * 0.8})`;
    } else if (activeSurvey === 'satisfaction-survey') {
      return `rgba(59, 130, 246, ${0.2 + value * 0.8})`;
    } else {
      return `rgba(139, 92, 246, ${0.2 + value * 0.8})`;
    }
  };

  // Hex shape generator
  const hexPath = (x, y, size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      const pointX = x + size * Math.cos(angleRad);
      const pointY = y + size * Math.sin(angleRad);
      points.push(`${pointX},${pointY}`);
    }
    return points.join(' ');
  };

  // Handle hex click
  const handleHexClick = (hex) => {
    setSelectedHexagon(hex);
  };

  // Survey options
  const surveys = [
    { id: 'consumer-preferences', name: 'Consumer Preferences', color: 'bg-emerald-500' },
    { id: 'satisfaction-survey', name: 'Service Satisfaction', color: 'bg-blue-500' },
    { id: 'community-feedback', name: 'Community Feedback', color: 'bg-purple-500' }
  ];

  // Filter options
  const filters = ['All Responses', 'Last 30 Days', 'Urban Areas', 'Rural Areas'];

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="text-green-400" />
            <h2 className="text-xl font-semibold text-white">SurveyMap Demo</h2>
          </div>
          <div className="flex space-x-3">
            <button 
              className="p-2 rounded hover:bg-gray-800"
              onClick={() => setShowLegend(!showLegend)}
            >
              <Info size={20} className="text-gray-400" />
            </button>
            <div className="relative">
              <button className="px-3 py-2 bg-gray-800 rounded flex items-center space-x-1">
                <Filter size={16} className="text-gray-300" />
                <span className="text-sm text-gray-300">{selectedFilter}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-2">
          {surveys.map(survey => (
            <button
              key={survey.id}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeSurvey === survey.id 
                  ? `${survey.color} text-white` 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveSurvey(survey.id)}
            >
              {survey.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-950 p-4">
          <svg width="100%" height="100%" viewBox="0 0 800 500">
            <g transform="translate(100, 50)">
              {hexagons.map(hex => (
                <polygon
                  key={hex.id}
                  points={hexPath(hex.x, hex.y, 30)}
                  fill={getColor(hex.value)}
                  stroke="#374151"
                  strokeWidth="1"
                  opacity={selectedHexagon?.id === hex.id ? 1 : 0.9}
                  strokeOpacity={selectedHexagon?.id === hex.id ? 1 : 0.7}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedHexagon?.id === hex.id ? 'stroke-2 stroke-white' : ''
                  }`}
                  onClick={() => handleHexClick(hex)}
                />
              ))}
            </g>
          </svg>

          {/* Legend */}
          {showLegend && (
            <div className="absolute bottom-4 right-4 bg-gray-900 p-3 rounded-lg border border-gray-800 shadow-lg">
              <div className="text-sm font-medium text-gray-300 mb-2">Response Intensity</div>
              <div className="flex items-center space-x-1">
                <div className="w-full h-4 rounded-sm bg-gradient-to-r from-gray-700 to-emerald-500"></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Response Details */}
        {selectedHexagon && (
          <div className="w-64 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-1">Region Analysis</h3>
              <div className="text-xs text-gray-400">Hexagon #{selectedHexagon.id.split('-')[2]}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <div className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <BarChart size={16} className="mr-1 text-green-400" />
                Response Distribution
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Option A</span>
                    <span className="text-gray-300">{selectedHexagon.responseDist.option1}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{width: `${selectedHexagon.responseDist.option1}%`}}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Option B</span>
                    <span className="text-gray-300">{selectedHexagon.responseDist.option2}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{width: `${selectedHexagon.responseDist.option2}%`}}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Option C</span>
                    <span className="text-gray-300">{selectedHexagon.responseDist.option3}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{width: `${selectedHexagon.responseDist.option3}%`}}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Option D</span>
                    <span className="text-gray-300">{selectedHexagon.responseDist.option4}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{width: `${selectedHexagon.responseDist.option4}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
              View Detailed Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyMapDemo;