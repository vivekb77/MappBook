//SummaryStep.tsx
import React from 'react';
import { PollData } from './poll-types';
import { AlertTriangle } from 'lucide-react';

interface SummaryStepProps {
  formData: PollData;
  isDarkMode: boolean;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ formData, isDarkMode }) => {
  return (
    <div>
      <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Review Your Poll
      </h3>

      <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <div className="mb-5">
          <h4 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Poll Details
          </h4>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            <span className="font-medium">Name:</span> {formData.title}
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            <span className="font-medium">Author:</span> {formData.author}
          </p>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            <span className="font-medium">Duration:</span> {formData.pollLength} days
          </p>
          {formData.description && (
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              <span className="font-medium">Description:</span> {formData.description}
            </p>
          )}
        </div>

        <div>
          <h4 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Questions
          </h4>
          <div className="space-y-3">
            {formData.questions.map((question, qIndex) => (
              <div key={qIndex} className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white border border-gray-200'}`}>
                <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-medium">Q{qIndex + 1}:</span> {question.text}
                </p>
                <div className="pl-4">
                  {question.options.filter(opt => opt.trim()).map((option, oIndex) => (
                    <p key={oIndex} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {oIndex + 1}. {option}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg mb-4 flex items-start gap-3 ${
        isDarkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-50 text-amber-800'
      }`}>
        <AlertTriangle size={20} className={isDarkMode ? 'text-amber-400 mt-0.5' : 'text-amber-500 mt-0.5'} />
        <div>
          <p className="font-medium mb-1">Important:</p>
          <p className={`text-sm ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            Once a poll is created, it cannot be edited. Please review all details carefully before saving.
          </p>
        </div>
      </div>

      <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        After saving, your poll will be saved and a unique URL will be generated for sharing.
        You'll find your poll in the "My Polls" section.
      </p>
    </div>
  );
};

export default SummaryStep;