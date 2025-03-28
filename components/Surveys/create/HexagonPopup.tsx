// components/HexagonPopup.tsx
import React, { useState, useEffect } from 'react';

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
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  // Check viewport size on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Adjust popup dimensions based on device
  const POPUP_WIDTH = isMobile ? Math.min(viewBox.width * 0.9, 450) : 400;
  
  // Calculate dynamic height based on team count with a minimum
  const BASE_HEIGHT = 230; // Increased for larger text
  const TEAM_ROW_HEIGHT = isMobile ? 60 : 50; // Increased for larger text
  const POPUP_HEIGHT = BASE_HEIGHT + (popupData.teams.length * TEAM_ROW_HEIGHT);
  
  // Position popup in extreme top right corner with minimal margin
  const MARGIN = 10;
  const POPUP_X = viewBox.width - POPUP_WIDTH - MARGIN;
  const POPUP_Y = MARGIN;
  
  const BORDER_RADIUS = 10; // Slightly increased
  
  // Get the color for the header - use blue matching the screenshot instead of team color
  const headerColor = "#0052A5"; // Royal blue color matching the screenshot
  
  // Calculate bar widths - set a reasonable max to prevent overflow
  const maxBarWidth = POPUP_WIDTH - 80; // Adjusted for positioning
  
  // Increase font sizes further
  const titleFontSize = isMobile ? 26 : 22;
  const subtitleFontSize = isMobile ? 18 : 16;
  const textFontSize = isMobile ? 20 : 18;
  const teamNameFontSize = isMobile ? 18 : 16;
  
  return (
    <g pointerEvents="all">
      
      {/* Popup container with shadow */}
      <rect
        x={POPUP_X + 4}
        y={POPUP_Y + 4}
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
        height={isMobile ? 70 : 60}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill={headerColor}
      />
      
      {/* Overlay to create gradient effect */}
      <rect
        x={POPUP_X}
        y={POPUP_Y + (isMobile ? 35 : 30)}
        width={POPUP_WIDTH}
        height={isMobile ? 35 : 30}
        fill={headerColor}
      />
      
      {/* Title */}
      <text
        x={POPUP_X + (POPUP_WIDTH / 2)}
        y={POPUP_Y + (isMobile ? 35 : 30)}
        fontSize={titleFontSize}
        fontWeight="bold"
        textAnchor="middle"
        fill="white"
      >
        Region {popupData.home_hexagon}
      </text>
      
      {/* Subtitle */}
      <text
        x={POPUP_X + (POPUP_WIDTH / 2)}
        y={POPUP_Y + (isMobile ? 60 : 52)}
        fontSize={subtitleFontSize}
        textAnchor="middle"
        fill="white"
        opacity="0.9"
      >
        Fan Distribution Analysis
      </text>
      
      {/* Total Fans - with bold label */}
      <text
        x={POPUP_X + 25}
        y={POPUP_Y + (isMobile ? 110 : 95)}
        fontSize={textFontSize}
        fontWeight="bold"
        fill="#333"
      >
        Total Fans:
      </text>
      
      <text
        x={POPUP_X + POPUP_WIDTH - 25}
        y={POPUP_Y + (isMobile ? 110 : 95)}
        fontSize={textFontSize}
        fontWeight="bold"
        textAnchor="end"
        fill="#333"
      >
        {popupData.total_fans.toLocaleString()}
      </text>
      
      {/* Section divider */}
      <line
        x1={POPUP_X + 25}
        y1={POPUP_Y + (isMobile ? 130 : 115)}
        x2={POPUP_X + POPUP_WIDTH - 25}
        y2={POPUP_Y + (isMobile ? 130 : 115)}
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      
      {/* Team breakdown title */}
      <text
        x={POPUP_X + 25}
        y={POPUP_Y + (isMobile ? 160 : 145)}
        fontSize={textFontSize}
        fontWeight="bold"
        fill="#333"
      >
        Team Breakdown:
      </text>
      
      {/* Team breakdown with name and bar stacked vertically */}
      {popupData.teams.map((team, index) => {
        const barWidth = (team.percentage / 100) * maxBarWidth;
        const yOffset = isMobile ? 190 : 175;
        
        return (
          <g key={`team-${index}`}>
            {/* Team indicator and name */}
            <circle
              cx={POPUP_X + 30}
              cy={POPUP_Y + yOffset + (index * TEAM_ROW_HEIGHT)}
              r={isMobile ? 10 : 8}
              fill={teamColors[team.team] || "#cccccc"}
            />
            
            <text
              x={POPUP_X + (isMobile ? 48 : 45)}
              y={POPUP_Y + (yOffset + 5) + (index * TEAM_ROW_HEIGHT)}
              fontSize={teamNameFontSize}
              fill="#333"
            >
              {team.team} - {team.count.toLocaleString()} ({team.percentage.toFixed(1)}%)
            </text>
            
            {/* Bar background below the name */}
            <rect
              x={POPUP_X + (isMobile ? 48 : 45)}
              y={POPUP_Y + (yOffset + 12) + (index * TEAM_ROW_HEIGHT)}
              width={maxBarWidth}
              height={isMobile ? 10 : 8}
              rx="4"
              ry="4"
              fill="#f0f0f0"
            />
            
            {/* Progress bar */}
            <rect
              x={POPUP_X + (isMobile ? 48 : 45)}
              y={POPUP_Y + (yOffset + 12) + (index * TEAM_ROW_HEIGHT)}
              width={Math.max(4, barWidth)}
              height={isMobile ? 10 : 8}
              rx="4"
              ry="4"
              fill={teamColors[team.team] || "#cccccc"}
            />
          </g>
        );
      })}
      
      {/* Close button */}
      <g onClick={onClose} style={{ cursor: 'pointer' }} pointerEvents="all">
        <circle
          cx={POPUP_X + POPUP_WIDTH - (isMobile ? 25 : 20)}
          cy={POPUP_Y + (isMobile ? 25 : 20)}
          r={isMobile ? 18 : 15}
          fill="rgba(255,255,255,0.3)"
        />
        <text
          x={POPUP_X + POPUP_WIDTH - (isMobile ? 25 : 20)}
          y={POPUP_Y + (isMobile ? 31 : 25)}
          fontSize={isMobile ? 26 : 22}
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