import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Hexagon } from '../utils/MapLogic';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface PollQuestionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  selectedHexagon: Hexagon | null; // Add the selectedHexagon prop
}

const PollQuestionPopup: React.FC<PollQuestionPopupProps> = ({
  isOpen,
  onClose,
  questions,
  onSubmit,
  selectedHexagon
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId
    });
  };

  const handleSubmit = () => {
    onSubmit(selectedOptions);
    onClose();
  };

  const isLastQuestion = currentStep === questions.length - 1;
  const canProceed = selectedOptions[questions[currentStep]?.id];
  const allQuestionsAnswered = questions.every(q => selectedOptions[q.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Answer Poll Questions</h2>
            {/* Region information */}
            <div className={`text-sm mt-1 ${selectedHexagon ? 'text-green-600 font-medium' : 'text-red-500'}`}>
              {selectedHexagon 
                ? `Selected Region: ${selectedHexagon.number}`
                : "Please select your region hexagon on the map first"
              }
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current question */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">{questions[currentStep]?.text}</h3>
            <div className="space-y-3">
              {questions[currentStep]?.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedOptions[questions[currentStep]?.id] === option.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                  onClick={() => handleOptionSelect(questions[currentStep]?.id, option.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border flex-shrink-0 mr-3 flex items-center justify-center ${
                      selectedOptions[questions[currentStep]?.id] === option.id
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-400'
                    }`}>
                      {selectedOptions[questions[currentStep]?.id] === option.id && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-gray-800">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed || !selectedHexagon} // Disable if no region selected
                className={`px-4 py-2 rounded ${
                  !canProceed || !selectedHexagon
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || !selectedHexagon} // Disable if no region selected
                className={`px-4 py-2 rounded ${
                  !allQuestionsAnswered || !selectedHexagon
                    ? 'bg-indigo-300 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollQuestionPopup;