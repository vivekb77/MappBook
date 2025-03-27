// components/SurveyPanel.tsx
import React, { useState, useEffect } from 'react';

// Sample survey options
const SURVEY_OPTIONS = [
  'Strongly Agree',
  'Agree',
  'Neutral',
  'Disagree',
  'Strongly Disagree'
];

// Equivalent to the SetFandomPopup but generalized for any survey
interface SurveyPanelProps {
  selectedHexagon: { id: string; number: number } | null;
  onClose: () => void;
  onSubmit: (hexagonNumber: number | null, choice: string) => void;
  currentSelection?: string;
}

const SurveyPanel: React.FC<SurveyPanelProps> = ({ 
  selectedHexagon, 
  onClose, 
  onSubmit,
  currentSelection = ''
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // When component mounts or selected hexagon changes
  useEffect(() => {
    // If we have a current selection, use it
    if (currentSelection) {
      setSelectedOption(currentSelection);
    } else {
      setSelectedOption('');
    }
    
    // Reset state when hexagon changes
    setError('');
    setSuccess(false);
  }, [selectedHexagon, currentSelection]);

  const handleSubmit = async () => {
    // Reset previous states
    setError('');
    setSuccess(false);

    // Validate input
    if (!selectedHexagon) {
      setError('Please select a region on the map first');
      return;
    }
    
    if (!selectedOption) {
      setError('Please select a response option');
      return;
    }

    try {
      setSubmitting(true);
      
      // Simulating API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would send this to your API
      // const response = await fetch('/api/survey-responses', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     hexagonNumber: selectedHexagon.number,
      //     response: selectedOption,
      //     timestamp: new Date().toISOString()
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to save response');
      // }
      
      // Success
      setSuccess(true);
      
      // Update parent component
      onSubmit(selectedHexagon.number, selectedOption);
      
      // Close panel after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting survey response:', error);
      setError('Failed to submit your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute left-8 bottom-20 bg-white rounded-lg shadow-lg p-4 w-80 max-w-full">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-semibold text-green-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Survey Response
        </h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Region Selection */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-800 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-700">Selected Region:</span>
        </div>
        <span className="text-green-800 font-bold">
          {selectedHexagon ? selectedHexagon.number : 'None'}
        </span>
      </div>

      {/* Survey Question */}
      <div className="mb-4">
        <h4 className="text-gray-700 mb-2">Question: How satisfied are you with local services in this area?</h4>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          {SURVEY_OPTIONS.map((option) => (
            <div key={option} className="mb-2 last:mb-0">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="surveyOption"
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  className="form-radio h-4 w-4 text-green-800 transition duration-150 ease-in-out"
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded flex items-start">
          <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-2 bg-green-50 text-green-600 text-sm rounded flex items-start">
          <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Your response has been saved successfully!</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        className={`w-full py-2 bg-green-800 text-white rounded flex items-center justify-center 
          ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Response
          </>
        )}
      </button>
    </div>
  );
};

export default SurveyPanel;