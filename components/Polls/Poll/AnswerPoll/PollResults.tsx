import React from 'react';

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
}

const PollResults: React.FC<PollResultsProps> = ({
  isOpen,
  onClose,
  questions,
  answers
}) => {
  if (!isOpen) return null;

  // Find the text of the selected option for each question
  const getSelectedOptionText = (questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return 'Not answered';
    
    const selectedOptionId = answers[questionId];
    if (!selectedOptionId) return 'Not answered';
    
    const selectedOption = question.options.find(o => o.id === selectedOptionId);
    return selectedOption ? selectedOption.text : 'Not answered';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Poll Answers</h2>
          
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{question.text}</h3>
                <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                  <span className="font-medium">Your answer: </span>
                  <span>{getSelectedOptionText(question.id)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollResults;