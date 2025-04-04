//SummaryStep.tsx
import React from 'react';
import { PollData } from './poll-types';

interface SummaryStepProps {
  formData: PollData;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ formData }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-100 mb-4">Review Your Poll</h3>

      <div className="bg-gray-700 p-4 rounded-lg mb-6">
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-200 mb-2">Poll Details</h4>
          <p className="text-gray-300"><span className="font-medium">Name:</span> {formData.title}</p>
          <p className="text-gray-300"><span className="font-medium">Author:</span> {formData.author}</p>
          <p className="text-gray-300"><span className="font-medium">Duration:</span> {formData.pollLength} days</p>
          {formData.description && (
            <p className="text-gray-300"><span className="font-medium">Description:</span> {formData.description}</p>
          )}
        </div>

        <div>
          <h4 className="text-lg font-medium text-gray-200 mb-2">Questions</h4>
          <div className="space-y-3">
            {formData.questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-300 mb-2"><span className="font-medium">Q{qIndex + 1}:</span> {question.text}</p>
                <div className="pl-4">
                  {question.options.filter(opt => opt.trim()).map((option, oIndex) => (
                    <p key={oIndex} className="text-gray-400">
                      {oIndex + 1}. {option}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-800 text-yellow-200 p-3 rounded-lg mb-4">
        <p className="text-sm font-medium mb-1">Important:</p>
        <p className="text-sm">
          Once a poll is created, it cannot be edited. Please review all details carefully before saving.
        </p>
      </div>

      <p className="text-gray-400 mb-4">
        After saving, your poll will be saved and a unique URL will be generated for sharing.
        You&apos;ll find your poll in the &quot;My Polls&quot; section.
      </p>
    </div>
  );
};

export default SummaryStep;