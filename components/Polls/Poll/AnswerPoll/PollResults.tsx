import React from 'react';
import { X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface PollResultsProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  answers: Record<string, string>;
  hasAlreadyAnswered?: boolean;
}

const PollResults: React.FC<PollResultsProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  hasAlreadyAnswered = false
}) => {
  if (!isOpen) return null;

  // Function to get option text by id
  const getOptionTextById = (question: Question, optionId: string) => {
    const option = question.options.find(opt => opt.id === optionId);
    return option ? option.text : 'Option not found';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Poll Results</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Already answered message */}
        {hasAlreadyAnswered && (
          <div className="p-4 m-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">
                  You have answered this poll. Thank you for your participation!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content - scrollable area */}
        <div className="p-6 overflow-y-auto flex-grow">
          {Object.keys(answers).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {hasAlreadyAnswered ? (
                <p>Your responses have been recorded.</p>
              ) : (
                <p>No answers available to display.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => {
                const selectedOptionId = answers[question.id];
                if (!selectedOptionId) return null;
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-3">{question.text}</h3>
                    <div className="ml-4 mt-2">
                      <div className="flex items-center text-indigo-700">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{getOptionTextById(question, selectedOptionId)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollResults;