// components/QuestionsStep.tsx
import React from 'react';
import { PollData, PollQuestion, ValidationErrors, CharCounts } from './poll-types';
import { VALIDATION_CONSTRAINTS, safeRemoveHTML } from './validation-utils';
import CharacterCounter from './CharacterCounter';
import { Plus, Trash, X } from 'lucide-react';

interface QuestionsStepProps {
  formData: PollData;
  errors: ValidationErrors;
  charCounts: CharCounts;
  updateQuestions: (questions: PollQuestion[]) => void;
  isDarkMode: boolean;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  formData,
  errors,
  charCounts,
  updateQuestions,
  isDarkMode
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
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Poll Questions
        </h3>
        {formData.questions.length < VALIDATION_CONSTRAINTS.MAX_QUESTIONS && (
          <button
            type="button"
            onClick={addQuestion}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            <Plus size={16} />
            Add Question
          </button>
        )}
      </div>

      <div className="space-y-4">
        {formData.questions.map((question, qIndex) => (
          <div key={qIndex} className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Question {qIndex + 1}
              </h4>
              {formData.questions.length > VALIDATION_CONSTRAINTS.MIN_QUESTIONS && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${isDarkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  <Trash size={14} />
                  Remove
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={`question-${qIndex}`} className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Question Text
                </label>
                <CharacterCounter 
                  current={charCounts.questions[qIndex]?.text || 0} 
                  max={VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH}
                  isDarkMode={isDarkMode}
                />
              </div>
              <input
                type="text"
                id={`question-${qIndex}`}
                value={question.text}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                className={`w-full rounded-lg px-4 py-2.5 transition-colors focus:outline-none focus:ring-2
                  ${isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-gray-200 focus:ring-indigo-500 placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-800 focus:ring-indigo-400 placeholder-gray-400'}
                  ${errors.questions && errors.questions[qIndex] 
                    ? (isDarkMode ? 'border border-red-500' : 'border border-red-400') 
                    : (isDarkMode ? 'border border-slate-600' : 'border border-gray-200')}`}
                placeholder="Enter your question"
                maxLength={VALIDATION_CONSTRAINTS.QUESTION.MAX_LENGTH}
              />
              {errors.questions && errors.questions[qIndex] && (
                <p className="text-red-500 text-sm mt-1">{errors.questions[qIndex]}</p>
              )}
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Options</label>
                {Array.isArray(question.options) && question.options.length < VALIDATION_CONSTRAINTS.MAX_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => addOption(qIndex)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${isDarkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                  >
                    <Plus size={14} />
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
                        className={`w-full rounded-lg px-4 py-2.5 pr-16 transition-colors focus:outline-none focus:ring-2
                          ${isDarkMode 
                            ? 'bg-slate-700 border border-slate-600 text-gray-200 focus:ring-indigo-500 placeholder-gray-500' 
                            : 'bg-white border border-gray-200 text-gray-800 focus:ring-indigo-400 placeholder-gray-400'}`}
                        placeholder={`Option ${oIndex + 1}`}
                        maxLength={VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH}
                      />
                      <div className="absolute right-3 top-2.5">
                        <CharacterCounter 
                          current={charCounts.questions[qIndex]?.options[oIndex] || 0} 
                          max={VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    </div>
                    {Array.isArray(question.options) && question.options.length > VALIDATION_CONSTRAINTS.MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className={`ml-2 rounded-lg p-2 transition-colors
                          ${isDarkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        aria-label="Remove option"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Options 1 and 2 are required, additional options are optional (max {VALIDATION_CONSTRAINTS.MAX_OPTIONS}).
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionsStep;