// components/QuestionsStep.tsx
import React from 'react';
import { PollData, PollQuestion, ValidationErrors, CharCounts } from './poll-types';
import { VALIDATION_CONSTRAINTS, safeRemoveHTML } from './validation-utils';
import CharacterCounter from './CharacterCounter';

interface QuestionsStepProps {
  formData: PollData;
  errors: ValidationErrors;
  charCounts: CharCounts;
  updateQuestions: (questions: PollQuestion[]) => void;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  formData,
  errors,
  charCounts,
  updateQuestions
}) => {
  // Handle question changes with sanitization
  const handleQuestionTextChange = (index: number, value: string) => {
    // Only remove HTML tags, preserve ALL spaces
    const sanitizedValue = safeRemoveHTML(value);
    
    // Apply length constraints for questions
    const finalValue = sanitizedValue.length > VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH
      ? sanitizedValue.slice(0, VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH)
      : sanitizedValue;
      
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[index]) {
      updatedQuestions[index].text = finalValue;
      updateQuestions(updatedQuestions);
    }
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    // Only remove HTML tags, preserve ALL spaces
    const sanitizedValue = safeRemoveHTML(value);
    
    // Apply length constraints for options
    const finalValue = sanitizedValue.length > VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH
      ? sanitizedValue.slice(0, VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH)
      : sanitizedValue;
      
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options)) {
      updatedQuestions[qIndex].options[oIndex] = finalValue;
      updateQuestions(updatedQuestions);
    }
  };

  const addOption = (qIndex: number) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options) &&
      updatedQuestions[qIndex].options.length < VALIDATION_CONSTRAINTS.MAX_OPTIONS) {
      updatedQuestions[qIndex].options.push('');
      updateQuestions(updatedQuestions);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options) &&
      updatedQuestions[qIndex].options.length > VALIDATION_CONSTRAINTS.MIN_OPTIONS) {
      updatedQuestions[qIndex].options.splice(oIndex, 1);
      updateQuestions(updatedQuestions);
    }
  };

  const addQuestion = () => {
    if (formData.questions.length < VALIDATION_CONSTRAINTS.MAX_QUESTIONS) {
      const updatedQuestions = [...formData.questions, { text: '', options: ['', ''] }];
      updateQuestions(updatedQuestions);
    }
  };

  const removeQuestion = (index: number) => {
    if (formData.questions.length > VALIDATION_CONSTRAINTS.MIN_QUESTIONS) {
      const updatedQuestions = [...formData.questions];
      updatedQuestions.splice(index, 1);
      updateQuestions(updatedQuestions);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-100">Poll Questions</h3>
        {formData.questions.length < VALIDATION_CONSTRAINTS.MAX_QUESTIONS && (
          <button
            type="button"
            onClick={addQuestion}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1 rounded-lg text-sm"
          >
            Add Question
          </button>
        )}
      </div>

      <div className="space-y-6">
        {formData.questions.map((question, qIndex) => (
          <div key={qIndex} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-medium text-gray-200">Question {qIndex + 1}</h4>
              {formData.questions.length > VALIDATION_CONSTRAINTS.MIN_QUESTIONS && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1 rounded-lg text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={`question-${qIndex}`} className="block text-gray-300">Question Text</label>
                <CharacterCounter 
                  current={charCounts.questions[qIndex]?.text || 0} 
                  max={VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH} 
                />
              </div>
              <input
                type="text"
                id={`question-${qIndex}`}
                value={question.text}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                className={`w-full bg-gray-800 border ${errors.questions && errors.questions[qIndex] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={`Enter your question`}
                maxLength={VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH}
              />
              {errors.questions && errors.questions[qIndex] && (
                <p className="text-red-500 text-sm mt-1">{errors.questions[qIndex]}</p>
              )}
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-300">Options</label>
                {Array.isArray(question.options) && question.options.length < VALIDATION_CONSTRAINTS.MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-lg text-sm"
                  >
                    Add Option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {Array.isArray(question.options) && question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={option || ''}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                        placeholder={`Option ${oIndex + 1}`}
                        maxLength={VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH}
                      />
                      <div className="absolute right-2 top-2">
                        <CharacterCounter 
                          current={charCounts.questions[qIndex]?.options[oIndex] || 0} 
                          max={VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH} 
                        />
                      </div>
                    </div>
                    {Array.isArray(question.options) && question.options.length > VALIDATION_CONSTRAINTS.MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="ml-2 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-gray-400 text-sm">
              Options 1 and 2 are required, additional options are optional (max {VALIDATION_CONSTRAINTS.MAX_OPTIONS}).
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionsStep;