// components/EnhancedShareComponent.tsx
import React, { useState, useEffect } from 'react';
import { Share2, MessageCircle, Twitter, Award } from 'lucide-react';
import { useTeam } from '../../IPL/TeamContext';

// Team colors map (matching the one from MapContainer)
const TEAM_COLORS: Record<string, string> = {
  'Chennai Super Kings': '#FFDC00',     // Yellow
  'Gujarat Titans': '#39B6FF',          // Light Blue
  'Kolkata Knight Riders': '#552583',   // Purple
  'Punjab Kings': '#ED1B24',            // Red
  'Rajasthan Royals': '#FF69B4',        // Pink
  'Royal Challengers Bengaluru': '#2B2A29', // Black/Dark gray
  'Sunrisers Hyderabad': '#FF6500',     // Orange,
  'Lucknow Super Giants': '#3496ff',    // Blue with yellow/gold accent
  'Mumbai Indians': '#00305a',          // Deep blue with light blue accent
  'Delhi Capitals': '#0033A0',          // Red with navy blue accent
};

// Team tag lines
const TEAM_TAGLINES: Record<string, string> = {
  'Chennai Super Kings': 'Whistle Podu! 🦁',
  'Gujarat Titans': 'aava de! 🔱',
  'Kolkata Knight Riders': 'Korbo Lorbo Jeetbo! 🐎',
  'Punjab Kings': 'Sadda Punjab! 👑',
  'Rajasthan Royals': 'Halla Bol! 👑',
  'Royal Challengers Bengaluru': 'Ee Sala Cup Namde! 🔴',
  'Sunrisers Hyderabad': 'Orange Army! 🧡',
  'Lucknow Super Giants': 'Ab Apni Baari Hai! 🦁',
  'Mumbai Indians': 'Duniya Hila Denge! 💙',
  'Delhi Capitals': 'Roar Macha! 🦁',
};

// Team rivals - adding primary rivals for each team for competitive messaging
const TEAM_RIVALS: Record<string, string[]> = {
  'Chennai Super Kings': ['Mumbai Indians', 'Royal Challengers Bengaluru'],
  'Gujarat Titans': ['Rajasthan Royals', 'Lucknow Super Giants'],
  'Kolkata Knight Riders': ['Mumbai Indians', 'Sunrisers Hyderabad'],
  'Punjab Kings': ['Delhi Capitals', 'Royal Challengers Bengaluru'],
  'Rajasthan Royals': ['Gujarat Titans', 'Mumbai Indians'],
  'Royal Challengers Bengaluru': ['Chennai Super Kings', 'Mumbai Indians'],
  'Sunrisers Hyderabad': ['Kolkata Knight Riders', 'Chennai Super Kings'],
  'Lucknow Super Giants': ['Gujarat Titans', 'Delhi Capitals'],
  'Mumbai Indians': ['Chennai Super Kings', 'Royal Challengers Bengaluru'],
  'Delhi Capitals': ['Punjab Kings', 'Lucknow Super Giants'],
};

interface EnhancedShareComponentProps {
  onShareClick?: () => void;
  customUrl?: string;
}

// Generate a rival message based on a team and its rival
const generateRivalMessage = (teamName: string): string => {
  if (!teamName || !TEAM_RIVALS[teamName] || TEAM_RIVALS[teamName].length === 0) {
    return '';
  }
  
  const teamRivals = TEAM_RIVALS[teamName];
  const rival = teamRivals[Math.floor(Math.random() * teamRivals.length)];
  
  const messages = [
    `${rival} fans are gaining ground! Defend your territory!`,
    `Outshine ${rival} fans! Share now!`,
    `${rival} is challenging us! Recruit more fans!`
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

const EnhancedShareComponent: React.FC<EnhancedShareComponentProps> = ({ onShareClick, customUrl }) => {
  const { selectedTeam, isTeamSelected, homeHexagon } = useTeam();
  const [showShareNotification, setShowShareNotification] = useState<boolean>(false);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  const [pulseBorder, setPulseBorder] = useState<boolean>(false);
  const [rivalStatusMessage, setRivalStatusMessage] = useState<string>('');

  // Get the appropriate team color for styling
  const teamColor = isTeamSelected && selectedTeam ? TEAM_COLORS[selectedTeam] : '#1A5D1A';
  const tagline = isTeamSelected && selectedTeam ? TEAM_TAGLINES[selectedTeam] : '';

  // Initialize rival message when team changes
  useEffect(() => {
    if (isTeamSelected && selectedTeam) {
      const message = generateRivalMessage(selectedTeam);
      setRivalStatusMessage(message);
    } else {
      setRivalStatusMessage('');
    }
  }, [isTeamSelected, selectedTeam]);
  
  // Pulse animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseBorder(true);
      setTimeout(() => setPulseBorder(false), 3000);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to get a random rival team for a given team
  const getRandomRival = (teamName: string): string => {
    if (!teamName || !TEAM_RIVALS[teamName] || TEAM_RIVALS[teamName].length === 0) {
      return '';
    }
    
    const teamRivals = TEAM_RIVALS[teamName];
    return teamRivals[Math.floor(Math.random() * teamRivals.length)];
  };

  // Function to copy URL to clipboard with team context
  const copyShareURL = (customUrl?: string) => {
    if (typeof window !== 'undefined') {
      // Use custom URL if provided, otherwise use current URL
      const shareURL = customUrl || window.location.href;

      // Copy to clipboard
      navigator.clipboard.writeText(shareURL)
        .then(() => {
          // Show notification
          setShowShareNotification(true);
          setShowAnimation(true);
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setShowShareNotification(false);
          }, 3000);
          
          // Hide animation after 1 second
          setTimeout(() => {
            setShowAnimation(false);
          }, 1000);
          
          // Call the optional callback
          if (onShareClick) {
            onShareClick();
          }
        })
        .catch(err => {
          console.error('Error copying text: ', err);
          alert('Failed to copy URL to clipboard.');
        });
    }
  };

  // Generate dynamic, compelling share text based on team selection and rivals
  const getShareText = () => {
    if (isTeamSelected && selectedTeam) {
      const rival = getRandomRival(selectedTeam);
      const rivalContext = rival ? ` Don't let ${rival} fans take over!` : '';
      
      const messages = [
        `I'm proudly supporting ${selectedTeam}! ${tagline} Join my team and let's dominate the IPL Fan Map together!${rivalContext}`,
        `${selectedTeam} needs YOUR support! ${tagline} Join me on the IPL Fan Map and help us claim more territory from ${rival}!`,
        `Are you a real ${selectedTeam} fan? Prove it! ${tagline} Join me on the IPL Fan Map and let's show our power against ${rival}!`,
        `The battle for cricket supremacy is ON! I've claimed my spot for ${selectedTeam} against ${rival}. ${tagline} Join me now!`,
        `${selectedTeam} forever! ${tagline} Our team needs more fans to outshine ${rival} on the IPL Fan Map. Join the movement!`,
        `${rival} fans are gaining ground! As a proud ${selectedTeam} supporter, I need your help to defend our territory! ${tagline}`,
        `Show ${rival} who's boss! Join me in supporting ${selectedTeam} on the IPL Fan Map and let's conquer more regions! ${tagline}`
      ];
      
      // Select a random message for variety
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }
    return 'Join the IPL Fan Battle and help us conquer more regions on the fan map!';
  };

  // Function to share on WhatsApp with optional custom URL
  const shareOnWhatsApp = (customUrl?: string) => {
    const shareText = getShareText();
    const shareUrl = customUrl || window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  // Function to share on Twitter/X with optional custom URL
  const shareOnTwitter = (customUrl?: string) => {
    const shareText = getShareText();
    const shareUrl = customUrl || window.location.href;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  return (
    <>
      <div className={`bg-white rounded-lg shadow-lg w-full overflow-hidden transition-all duration-300 hover:shadow-xl ${pulseBorder ? 'animate-pulse-border' : ''}`}
        style={{ 
          '--team-color-rgb': isTeamSelected ? hexToRgb(teamColor) : '26, 93, 26'
        } as React.CSSProperties}
      >
        {/* Team Badge - Only show if team is selected */}
        {isTeamSelected && (
          <div className="w-full bg-gradient-to-r px-2 py-1 flex items-center justify-center animate-float"
            style={{ 
              backgroundImage: `linear-gradient(to right, ${teamColor}20, ${teamColor}40, ${teamColor}20)`
            }}
          >
            <Award size={12} className="mr-1" style={{ color: teamColor }} />
            <span className="text-xs font-bold" style={{ color: teamColor }}>
              {selectedTeam} Fan, Region {homeHexagon || ''}
            </span>
          </div>
        )}
        
        {/* Main Share Button with Team Context */}
        <button
          onClick={() => copyShareURL(customUrl)}
          className="w-full px-2 py-2 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors animate-shine"
          style={{ 
            color: teamColor,
            borderLeft: isTeamSelected ? `4px solid ${teamColor}` : 'none'
          }}
          aria-label="Share URL"
        >
          
          {/* Rival status message - only show if team is selected and we have a message */}
          {isTeamSelected && rivalStatusMessage && (
            <div className="text-xs mb-1 p-1 px-2 rounded-full animate-flash" 
              style={{ 
                backgroundColor: `${teamColor}15`, 
                color: "#FF4136",
                fontWeight: "bold"
              }}
            >
              {rivalStatusMessage}
            </div>
          )}
          
          {isTeamSelected && tagline && (
            <div className="text-xs font-bold mb-2 p-1 px-2 rounded-full animate-flash" 
              style={{ 
                backgroundColor: `${teamColor}20`, 
                color: teamColor
              }}
            >
              {tagline}
            </div>
          )}
          
          <div className={`flex items-center ${showAnimation ? 'animate-bounce' : ''}`}>
            <span className="font-semibold text-xs">Share with your Army!</span>
          </div>
        </button>

        {/* Social Share Options with Team Branding */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => shareOnWhatsApp(customUrl)}
            className="flex-1 py-2 text-center text-white flex items-center justify-center transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: isTeamSelected ? teamColor : '#25D366' }}
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs font-medium">WhatsApp</span>
          </button>

          <button
            onClick={() => shareOnTwitter(customUrl)}
            className="flex-1 py-2 text-center text-white flex items-center justify-center transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: isTeamSelected ? `${teamColor}DD` : '#1DA1F2' }} // Slightly transparent version
            aria-label="Share on Twitter/X"
          >
            <Twitter className="mr-1 h-4 w-4" />
            <span className="text-xs font-medium">Twitter/X</span>
          </button>
        </div>
      </div>

      {/* URL Share notification */}
      {showShareNotification && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out"
          style={{ 
            backgroundColor: isTeamSelected ? teamColor : '#1A5D1A',
            color: '#FFFFFF'
          }}
        >
          {isTeamSelected ? (
            <div className="flex items-center">
              <Award className="mr-1 h-4 w-4" />
              <span>{selectedTeam} link copied! Ready to share!</span>
            </div>
          ) : 'Link copied!'}
        </div>
      )}
    </>
  );
};

// Helper function to convert hex color to RGB format for CSS variables
const hexToRgb = (hex: string): string => {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return the RGB values as a comma-separated string
  return `${r}, ${g}, ${b}`;
};

export default EnhancedShareComponent;