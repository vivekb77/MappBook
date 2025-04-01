import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip, TooltipProps } from 'recharts';

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

interface ChartDataItem {
  name: string;
  value: number;
  count: number;
  color: string;
}

// Typing for custom tooltip
interface CustomTooltipProps extends TooltipProps<number, string> {
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataItem;
  }>;
}

const TeamDistributionModal: React.FC<TeamDistributionModalProps> = ({ 
  showModal, 
  onClose,
  mapData 
}) => {
  if (!showModal) return null;

  // Team colors mapping
  const teamColors: { [key: string]: string } = {
    'Chennai Super Kings': '#FFDC00',     // Yellow
    'Gujarat Titans': '#39B6FF',          // Light Blue
    'Kolkata Knight Riders': '#552583',   // Purple
    'Punjab Kings': '#ED1B24',            // Red
    'Rajasthan Royals': '#FF69B4',        // Pink
    'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
    'Sunrisers Hyderabad': '#FF6500',     // Orange
    'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
    'Mumbai Indians': '#00305a',          // Deep blue with light blue accent
    'Delhi Capitals': '#0033A0',          // Red with navy blue accent
  };
  
  // Team abbreviations for mobile view
  const teamAbbreviations: { [key: string]: string } = {
    'Chennai Super Kings': 'CSK',
    'Gujarat Titans': 'GT',
    'Kolkata Knight Riders': 'KKR',
    'Punjab Kings': 'PBKS',
    'Rajasthan Royals': 'RR',
    'Royal Challengers Bengaluru': 'RCB',
    'Sunrisers Hyderabad': 'SRH',
    'Lucknow Super Giants': 'LSG',
    'Mumbai Indians': 'MI',
    'Delhi Capitals': 'DC',
  };

  // Format data for pie chart and sort by percentage (descending)
  const chartData = (mapData?.data.global_team_distribution
    .map(item => ({
      name: item.team,
      value: item.percentage,
      count: item.count,
      color: teamColors[item.team] || '#cccccc'
    }))
    .sort((a, b) => b.value - a.value)) || [];

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-md">
          <p className="font-semibold">{payload[0].name}</p>
          <p>{`${payload[0].value.toFixed(2)}% (${payload[0].payload.count.toLocaleString()} fans)`}</p>
        </div>
      );
    }
    return null;
  };

  // Render outer labels
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, name, value } = props;
    
    // Only show labels for segments with percentage > 5% on smaller screens
    const smallScreen = window.innerWidth < 768;
    if (smallScreen && value < 5) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Use abbreviated team names on mobile
    const displayName = smallScreen ? teamAbbreviations[name] || name : name.split(' ').slice(0, 2).join(' ');
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#333333" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs md:text-sm"
        style={{ fontWeight: 500 }}
      >
        {`${displayName}: ${value.toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 sm:px-6 py-3 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.5-4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
              </svg>
              <h2 className="text-lg sm:text-xl font-bold">IPL 2025 Fan Leaderboard</h2>
            </div>
            <button 
              className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {mapData ? (
            <div>
              <div className="h-64 sm:h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 640 ? 50 : 80}
                      outerRadius={window.innerWidth < 640 ? 90 : 140}
                      paddingAngle={1}
                      dataKey="value"
                      labelLine={window.innerWidth >= 640}
                      label={renderCustomizedLabel}
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#ffffff" 
                          strokeWidth={1}
                        />
                      ))}
                      <Label
                        value="2025"
                        position="center"
                        className="text-2xl sm:text-4xl font-bold"
                        fill="#333333"
                        fontSize={window.innerWidth < 640 ? "1.5rem" : "2.5rem"}
                      />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 flex flex-col space-y-2">
                <div className="text-sm md:text-base text-gray-700 text-center font-medium">
                  Total Fans: <span className="font-bold text-indigo-700">{mapData.data.metadata.total_fans.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center space-y-3">
                <div className="rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600">Loading team data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDistributionModal;