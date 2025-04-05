import React, { useState, useEffect } from 'react';
import DrawMap from './Map/DrawMap';
import DrawHexagon from './Map/DrawHexagon';
import MapInteraction from './Map/MapInteraction';
import PollHeader from '../Poll/PollDetails/PollHeader';
import PollQuestionPopup from '../Poll/AnswerPoll/PollQuestionPopup';
import PollResults from '../Poll/AnswerPoll/PollResults';
import { ViewBox, GeoJSON, Hexagon, calculateViewBox } from './Map/utils/MapLogic';
import { generateHexagons } from './Map/utils/HexagonLogic';

import indiaStatesGeoJson from '../../../public/india-states.json';

interface PollData {
  poll_id: string;
  poll_id_to_share: string;
  title: string;
  description: string;
  author: string;
  pollLength: string;
  questions: any[];
  created_at: string;
  expires_at: string;
  is_active: boolean;
  isExpired: boolean;
}

interface ContainerProps {
  pollData: PollData;
}

const Container: React.FC<ContainerProps> = ({ pollData }) => {
  // Core map state
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON>(indiaStatesGeoJson as GeoJSON);
  const [viewBox, setViewBox] = useState<ViewBox>({
    width: 900,
    height: 800,
    minLon: 68,
    maxLon: 97,
    minLat: 8,
    maxLat: 37
  });

  // View transformation state
  const [scale, setScale] = useState<number>(1);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);

  // Hexagon state
  const [hexagons, setHexagons] = useState<Hexagon[]>([]);
  const [selectedHexagon, setSelectedHexagon] = useState<Hexagon | null>(null);

  // Poll popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [pollAnswers, setPollAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasAlreadyAnswered, setHasAlreadyAnswered] = useState(false);

  // Initialize viewbox and hexagons when geoJSON data is available
  useEffect(() => {
    if (geoJsonData) {
      const calculatedViewBox = calculateViewBox(geoJsonData);
      setViewBox(calculatedViewBox);

      // Generate hexagons based on the calculated viewbox
      const generatedHexagons = generateHexagons(calculatedViewBox, geoJsonData);
      setHexagons(generatedHexagons);
    }
  }, [geoJsonData]);

  // Check if user has already answered this poll
  useEffect(() => {
    const pollKey = `poll_${pollData.poll_id}`;
    const previousSubmission = localStorage.getItem(pollKey);

    if (previousSubmission) {
      // User has already answered this poll
      setHasAlreadyAnswered(true);

      // Try to get their previous answers
      try {
        const storedData = JSON.parse(previousSubmission);
        if (storedData.answers) {
          setPollAnswers(storedData.answers);
        }
      } catch (e) {
        console.error("Error parsing previous answers:", e);
      }
    }
  }, [pollData.poll_id]);

  // Store poll submission to localStorage
  const storePollSubmission = (answers: Record<string, string>) => {
    const pollKey = `poll_${pollData.poll_id}`;
    localStorage.setItem(pollKey, JSON.stringify({
      submitted: true,
      timestamp: new Date().toISOString(),
      answersSubmitted: Object.keys(answers).length,
      answers: answers // Store the actual answers
    }));
  };

  // Handler for updating both translation coordinates
  const handleTranslateChange = (x: number, y: number) => {
    setTranslateX(x);
    setTranslateY(y);
  };

  // Reset the view to initial state
  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  // Handle hexagon selection
  const handleHexagonClick = (hexagon: Hexagon) => {
    setSelectedHexagon(hexagon);
  };

  // Handle poll submission
  const handlePollSubmit = async (answers: Record<string, string>) => {
    try {
      // Check if a hexagon is selected
      if (!selectedHexagon) {
        alert('Please select a region on the map before submitting');
        return;
      }

      // Start loading
      setIsLoading(true);

      // Get a unique identifier for this user's browser
      const userAgent = navigator.userAgent;
      const language = navigator.language;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Create a simple hash of these values
      const uniqueIdentifier = btoa(`${userAgent}-${language}-${screenWidth}x${screenHeight}-${timezone}`);

      // Map answers to the format expected by the API
      const answerPayloads = Object.entries(answers).map(([questionId, optionId]) => ({
        poll_id: pollData.poll_id,
        poll_id_to_share: pollData.poll_id_to_share,
        ip_address: uniqueIdentifier,
        hexagon_region: selectedHexagon.number, // Use the numeric property
        question_id: questionId,
        answer_option_id: optionId
      }));

      // Submit all answers
      const response = await fetch('/api/polls/answer-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answerPayloads
        }),
      });

      // Check response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit poll');
      }

      // Store answers in localStorage
      storePollSubmission(answers);

      // Update state
      setPollAnswers(answers);
      setHasAlreadyAnswered(true);

      // Close the questions popup
      setIsPopupOpen(false);

      // Show the results popup
      setIsResultsOpen(true);
    } catch (error) {
      console.error('Error submitting poll:', error);
      alert('Failed to submit your answers. Please try again.');
    } finally {
      // End loading state
      setIsLoading(false);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (geoJsonData) {
        const recalculatedViewBox = calculateViewBox(geoJsonData);
        setViewBox(recalculatedViewBox);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [geoJsonData]);

  // Loading state
  if (!geoJsonData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-green-800">Loading map data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-4 relative">
      {/* Logo */}
      <div className="relative group mb-4 self-start">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
        <div className="relative px-5 py-2 rounded-lg bg-white flex items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-gray-900">Mapp</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Book</span>
          </h1>
        </div>
      </div>

      {/* Poll Header */}
      <PollHeader
        title={pollData.title}
        author={pollData.author}
        description={pollData.description}
        expiresAt={pollData.expires_at}
        isActive={pollData.is_active}
        isExpired={pollData.isExpired}
      />

      {/* Map Container */}
      <div className="flex-grow">
        <MapInteraction
          scale={scale}
          translateX={translateX}
          translateY={translateY}
          onScaleChange={setScale}
          onTranslateChange={handleTranslateChange}
          onResetView={resetView}
        >
          <DrawMap
            geoJsonData={geoJsonData}
            viewBox={viewBox}
            scale={scale}
            translateX={translateX}
            translateY={translateY}
          >
            <DrawHexagon
              hexagons={hexagons}
              selectedHexagon={selectedHexagon}
              userHomeHexagon={null}
              onHexagonClick={handleHexagonClick}
              openPopup={() => hasAlreadyAnswered ? setIsResultsOpen(true) : setIsPopupOpen(true)}
            />
          </DrawMap>
        </MapInteraction>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <button
          onClick={() => hasAlreadyAnswered ? setIsResultsOpen(true) : setIsPopupOpen(true)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center pointer-events-auto"
        >
          {hasAlreadyAnswered ? "View Your Answers" : "Answer Poll Questions"}
        </button>
      </div>

      {/* Poll Questions Popup - only show if not already answered */}
      {!hasAlreadyAnswered && (
        <PollQuestionPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          questions={pollData.questions}
          onSubmit={handlePollSubmit}
          selectedHexagon={selectedHexagon}
          isLoading={isLoading}
        />
      )}

      {/* Poll Results Popup */}
      <PollResults
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        questions={pollData.questions}
        answers={pollAnswers}
        hasAlreadyAnswered={hasAlreadyAnswered}
      />
    </div>
  );
};

export default Container;