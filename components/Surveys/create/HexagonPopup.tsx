// components/HexagonPopup.tsx
import React from 'react';

// Team data interface
interface TeamData {
  team: string;
  count: number;
  percentage: number;
}

interface HexagonData {
  teams: TeamData[];
  total_fans: number;
  home_hexagon: number;
  dominant_team: string;
  dominance_percentage: number;
}

interface PopupPosition {
  x: number;
  y: number;
}

interface HexagonPopupProps {
  popupData: HexagonData;
  position: PopupPosition;
  viewBox: {
    width: number;
    height: number;
  };
  onClose: () => void;
  teamColors: Record<string, string>;
}

const HexagonPopup: React.FC<HexagonPopupProps> = ({
  popupData,
  position,
  viewBox,
  onClose,
  teamColors
}) => {
  // Keep the popup width the same, but reorganize layout
  const POPUP_WIDTH = 350;
  
  // Calculate dynamic height based on team count with a minimum
  const BASE_HEIGHT = 210; // Reduced since we removed a section
  const TEAM_ROW_HEIGHT = 40; // Increased to accommodate vertical stacking
  const POPUP_HEIGHT = BASE_HEIGHT + (popupData.teams.length * TEAM_ROW_HEIGHT);
  
  // Always center the popup on the screen
  const POPUP_X = (viewBox.width - POPUP_WIDTH) / 2;
  const POPUP_Y = (viewBox.height - POPUP_HEIGHT) / 2;
  
  const BORDER_RADIUS = 8;
  
  // Get the color for the header based on dominant team
  const teamColor = teamColors[popupData.dominant_team] || "#00a0b0";
  
  // Calculate bar widths - set a reasonable max to prevent overflow
  const maxBarWidth = 200; // Increased since bars will be on their own row
  
  return (
    <g>
      {/* Semi-transparent overlay */}
      <rect
        x="0"
        y="0"
        width={viewBox.width}
        height={viewBox.height}
        fill="rgba(0, 0, 0, 0.2)"
        onClick={onClose}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Popup container with shadow */}
      <rect
        x={POPUP_X + 3}
        y={POPUP_Y + 3}
        width={POPUP_WIDTH}
        height={POPUP_HEIGHT}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill="rgba(0, 0, 0, 0.2)"
      />
      
      {/* Main popup background */}
      <rect
        x={POPUP_X}
        y={POPUP_Y}
        width={POPUP_WIDTH}
        height={POPUP_HEIGHT}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill="white"
        stroke="#e0e0e0"
        strokeWidth="1"
      />
      
      {/* Header with gradient-like effect */}
      <rect
        x={POPUP_X}
        y={POPUP_Y}
        width={POPUP_WIDTH}
        height="50"
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill={teamColor}
      />
      
      {/* Overlay to create gradient effect */}
      <rect
        x={POPUP_X}
        y={POPUP_Y + 25}
        width={POPUP_WIDTH}
        height="25"
        fill={teamColor}
      />
      
      {/* Title */}
      <text
        x={POPUP_X + (POPUP_WIDTH / 2)}
        y={POPUP_Y + 25}
        fontSize="18"
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
      >
        Region {popupData.home_hexagon}
      </text>
      
      {/* Subtitle */}
      <text
        x={POPUP_X + (POPUP_WIDTH / 2)}
        y={POPUP_Y + 42}
        fontSize="12"
        textAnchor="middle"
        fill="white"
        opacity="0.9"
      >
        Fan Distribution Analysis
      </text>
      
      {/* Total Fans - with bold label */}
      <text
        x={POPUP_X + 15}
        y={POPUP_Y + 75}
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        Total Fans:
      </text>
      
      <text
        x={POPUP_X + POPUP_WIDTH - 15}
        y={POPUP_Y + 75}
        fontSize="14"
        fontWeight="bold"
        textAnchor="end"
        fill="#333"
      >
        {popupData.total_fans}
      </text>
      
      {/* Section divider */}
      <line
        x1={POPUP_X + 15}
        y1={POPUP_Y + 90}
        x2={POPUP_X + POPUP_WIDTH - 15}
        y2={POPUP_Y + 90}
        stroke="#e0e0e0"
        strokeWidth="1"
      />
      
      {/* Team breakdown title */}
      <text
        x={POPUP_X + 15}
        y={POPUP_Y + 110}
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        Team Breakdown:
      </text>
      
      {/* Team breakdown with name and bar stacked vertically */}
      {popupData.teams.map((team, index) => {
        const barWidth = (team.percentage / 100) * maxBarWidth;
        
        return (
          <g key={`team-${index}`}>
            {/* Team indicator and name */}
            <circle
              cx={POPUP_X + 20}
              cy={POPUP_Y + 135 + (index * TEAM_ROW_HEIGHT)}
              r="6"
              fill={teamColors[team.team] || "#cccccc"}
            />
            
            <text
              x={POPUP_X + 32}
              y={POPUP_Y + 139 + (index * TEAM_ROW_HEIGHT)}
              fontSize="13"
              fill="#333"
            >
              {team.team} - {team.count} ({team.percentage.toFixed(1)}%)
            </text>
            
            {/* Bar background below the name */}
            <rect
              x={POPUP_X + 32}
              y={POPUP_Y + 145 + (index * TEAM_ROW_HEIGHT)}
              width={maxBarWidth}
              height="6"
              rx="3"
              ry="3"
              fill="#f0f0f0"
            />
            
            {/* Progress bar */}
            <rect
              x={POPUP_X + 32}
              y={POPUP_Y + 145 + (index * TEAM_ROW_HEIGHT)}
              width={Math.max(3, barWidth)}
              height="6"
              rx="3"
              ry="3"
              fill={teamColors[team.team] || "#cccccc"}
            />
          </g>
        );
      })}
      
      {/* Close button */}
      <g onClick={onClose} style={{ cursor: 'pointer' }}>
        <circle
          cx={POPUP_X + POPUP_WIDTH - 15}
          cy={POPUP_Y + 15}
          r="10"
          fill="rgba(255,255,255,0.3)"
        />
        <text
          x={POPUP_X + POPUP_WIDTH - 15}
          y={POPUP_Y + 19}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          fill="white"
        >
          ×
        </text>
      </g>
    </g>
  );
};

export default HexagonPopup;