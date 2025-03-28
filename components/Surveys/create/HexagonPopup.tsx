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
  const POPUP_WIDTH = isMobile ? Math.min(viewBox.width * 0.9, 450) : 350;
  
  // Calculate dynamic height based on team count with a minimum
  const BASE_HEIGHT = 210; // Reduced since we removed a section
  const TEAM_ROW_HEIGHT = isMobile ? 50 : 40; // Increased for mobile
  const POPUP_HEIGHT = BASE_HEIGHT + (popupData.teams.length * TEAM_ROW_HEIGHT);
  
  // Always center the popup on the screen
  const POPUP_X = (viewBox.width - POPUP_WIDTH) / 2;
  const POPUP_Y = (viewBox.height - POPUP_HEIGHT) / 2;
  
  const BORDER_RADIUS = 8;
  
  // Get the color for the header based on dominant team
  const teamColor = teamColors[popupData.dominant_team] || "#00a0b0";
  
  // Calculate bar widths - set a reasonable max to prevent overflow
  const maxBarWidth = isMobile ? POPUP_WIDTH - 60 : 200;
  
  // Adjust font sizes for mobile
  const titleFontSize = isMobile ? 22 : 18;
  const subtitleFontSize = isMobile ? 14 : 12;
  const textFontSize = isMobile ? 16 : 14;
  const teamNameFontSize = isMobile ? 15 : 13;
  
  return (
    <g pointerEvents="all">
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
        height={isMobile ? 60 : 50}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill={teamColor}
      />
      
      {/* Overlay to create gradient effect */}
      <rect
        x={POPUP_X}
        y={POPUP_Y + (isMobile ? 30 : 25)}
        width={POPUP_WIDTH}
        height={isMobile ? 30 : 25}
        fill={teamColor}
      />
      
      {/* Title */}
      <text
        x={POPUP_X + (POPUP_WIDTH / 2)}
        y={POPUP_Y + (isMobile ? 30 : 25)}
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
        y={POPUP_Y + (isMobile ? 50 : 42)}
        fontSize={subtitleFontSize}
        textAnchor="middle"
        fill="white"
        opacity="0.9"
      >
        Fan Distribution Analysis
      </text>
      
      {/* Total Fans - with bold label */}
      <text
        x={POPUP_X + 20}
        y={POPUP_Y + (isMobile ? 90 : 75)}
        fontSize={textFontSize}
        fontWeight="bold"
        fill="#333"
      >
        Total Fans:
      </text>
      
      <text
        x={POPUP_X + POPUP_WIDTH - 20}
        y={POPUP_Y + (isMobile ? 90 : 75)}
        fontSize={textFontSize}
        fontWeight="bold"
        textAnchor="end"
        fill="#333"
      >
        {popupData.total_fans.toLocaleString()}
      </text>
      
      {/* Section divider */}
      <line
        x1={POPUP_X + 20}
        y1={POPUP_Y + (isMobile ? 105 : 90)}
        x2={POPUP_X + POPUP_WIDTH - 20}
        y2={POPUP_Y + (isMobile ? 105 : 90)}
        stroke="#e0e0e0"
        strokeWidth="1"
      />
      
      {/* Team breakdown title */}
      <text
        x={POPUP_X + 20}
        y={POPUP_Y + (isMobile ? 130 : 110)}
        fontSize={textFontSize}
        fontWeight="bold"
        fill="#333"
      >
        Team Breakdown:
      </text>
      
      {/* Team breakdown with name and bar stacked vertically */}
      {popupData.teams.map((team, index) => {
        const barWidth = (team.percentage / 100) * maxBarWidth;
        const yOffset = isMobile ? 155 : 135;
        
        return (
          <g key={`team-${index}`}>
            {/* Team indicator and name */}
            <circle
              cx={POPUP_X + 25}
              cy={POPUP_Y + yOffset + (index * TEAM_ROW_HEIGHT)}
              r={isMobile ? 8 : 6}
              fill={teamColors[team.team] || "#cccccc"}
            />
            
            <text
              x={POPUP_X + (isMobile ? 40 : 32)}
              y={POPUP_Y + (yOffset + 4) + (index * TEAM_ROW_HEIGHT)}
              fontSize={teamNameFontSize}
              fill="#333"
            >
              {team.team} - {team.count.toLocaleString()} ({team.percentage.toFixed(1)}%)
            </text>
            
            {/* Bar background below the name */}
            <rect
              x={POPUP_X + (isMobile ? 40 : 32)}
              y={POPUP_Y + (yOffset + 10) + (index * TEAM_ROW_HEIGHT)}
              width={maxBarWidth}
              height={isMobile ? 8 : 6}
              rx="3"
              ry="3"
              fill="#f0f0f0"
            />
            
            {/* Progress bar */}
            <rect
              x={POPUP_X + (isMobile ? 40 : 32)}
              y={POPUP_Y + (yOffset + 10) + (index * TEAM_ROW_HEIGHT)}
              width={Math.max(3, barWidth)}
              height={isMobile ? 8 : 6}
              rx="3"
              ry="3"
              fill={teamColors[team.team] || "#cccccc"}
            />
          </g>
        );
      })}
      
      {/* Close button */}
      <g onClick={onClose} style={{ cursor: 'pointer' }} pointerEvents="all">
        <circle
          cx={POPUP_X + POPUP_WIDTH - (isMobile ? 20 : 15)}
          cy={POPUP_Y + (isMobile ? 20 : 15)}
          r={isMobile ? 14 : 10}
          fill="rgba(255,255,255,0.3)"
        />
        <text
          x={POPUP_X + POPUP_WIDTH - (isMobile ? 20 : 15)}
          y={POPUP_Y + (isMobile ? 25 : 19)}
          fontSize={isMobile ? 20 : 16}
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