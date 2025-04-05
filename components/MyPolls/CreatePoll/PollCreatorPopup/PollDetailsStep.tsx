//PollDetailsStep.tsx
import React from 'react';
import { PollData, ValidationErrors, CharCounts } from './poll-types';
import { VALIDATION_CONSTRAINTS, safeRemoveHTML } from './validation-utils';
import CharacterCounter from './CharacterCounter';

interface PollDetailsStepProps {
  formData: PollData;
  errors: ValidationErrors;
  charCounts: CharCounts;
  onInputChange: (field: keyof PollData, value: string) => void;
  isDarkMode: boolean;
}

const PollDetailsStep: React.FC<PollDetailsStepProps> = ({
  formData,
  errors,
  charCounts,
  onInputChange,
  isDarkMode
}) => {
  const handleChange = (field: keyof PollData, value: string) => {
    // Only remove HTML tags, preserve ALL whitespace and spaces
    const sanitizedValue = safeRemoveHTML(value);
    
    // Apply length limits based on field type
    let finalValue = sanitizedValue;
    if (field === 'title' && sanitizedValue.length > VALIDATION_CONSTRAINTS.TITLE.MAX_LENGTH) {
      finalValue = sanitizedValue.slice(0, VALIDATION_CONSTRAINTS.TITLE.MAX_LENGTH);
    } else if (field === 'author' && sanitizedValue.length > VALIDATION_CONSTRAINTS.AUTHOR.MAX_LENGTH) {
      finalValue = sanitizedValue.slice(0, VALIDATION_CONSTRAINTS.AUTHOR.MAX_LENGTH);
    } else if (field === 'description' && sanitizedValue.length > VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
      finalValue = sanitizedValue.slice(0, VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH);
    }
    
    onInputChange(field, finalValue);
  };

  return (
    <div>
      <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        Poll Details
      </h3>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="pollTitle" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Poll Title <span className="text-red-500">*</span>
          </label>
          <CharacterCounter 
            current={charCounts.title} 
            max={VALIDATION_CONSTRAINTS.TITLE.MAX_LENGTH}
          />
        </div>
        <input
          type="text"
          id="pollTitle"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={`w-full rounded-lg px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2
            ${isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-gray-200 focus:ring-indigo-500 placeholder-gray-500' 
              : 'bg-gray-100 border-gray-200 text-gray-800 focus:ring-indigo-400 placeholder-gray-400'}
            ${errors.title 
              ? (isDarkMode ? 'border border-red-500' : 'border border-red-400') 
              : (isDarkMode ? 'border border-slate-700' : 'border border-gray-200')}`}
          placeholder="Title"
          maxLength={VALIDATION_CONSTRAINTS.TITLE.MAX_LENGTH}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="authorName" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Author Name <span className="text-red-500">*</span>
          </label>
          <CharacterCounter 
            current={charCounts.author} 
            max={VALIDATION_CONSTRAINTS.AUTHOR.MAX_LENGTH} 
          />
        </div>
        <input
          type="text"
          id="authorName"
          value={formData.author}
          onChange={(e) => handleChange('author', e.target.value)}
          className={`w-full rounded-lg px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2
            ${isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-gray-200 focus:ring-indigo-500 placeholder-gray-500' 
              : 'bg-gray-100 border-gray-200 text-gray-800 focus:ring-indigo-400 placeholder-gray-400'}
            ${errors.author 
              ? (isDarkMode ? 'border border-red-500' : 'border border-red-400') 
              : (isDarkMode ? 'border border-slate-700' : 'border border-gray-200')}`}
          placeholder="Can be your X or Instagram username"
          maxLength={VALIDATION_CONSTRAINTS.AUTHOR.MAX_LENGTH}
        />
        {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="pollLength" className={`block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Poll Duration <span className="text-red-500">*</span>
        </label>
        <select
          id="pollLength"
          value={formData.pollLength}
          onChange={(e) => handleChange('pollLength', e.target.value)}
          className={`w-full rounded-lg px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2
            ${isDarkMode 
              ? 'bg-slate-800 border border-slate-700 text-gray-200 focus:ring-indigo-500' 
              : 'bg-gray-100 border border-gray-200 text-gray-800 focus:ring-indigo-400'}`}
        >
          <option value="1">1 day</option>
          <option value="2">2 days</option>
          <option value="3">3 days</option>
          <option value="4">4 days</option>
          <option value="5">5 days</option>
          <option value="10">10 days</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="pollDescription" className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Description
          </label>
          <CharacterCounter 
            current={charCounts.description} 
            max={VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} 
          />
        </div>
        <textarea
          id="pollDescription"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full rounded-lg px-4 py-3 transition-colors duration-200 focus:outline-none focus:ring-2 min-h-[100px] resize-y
            ${isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-gray-200 focus:ring-indigo-500 placeholder-gray-500' 
              : 'bg-gray-100 border-gray-200 text-gray-800 focus:ring-indigo-400 placeholder-gray-400'}
            ${errors.description 
              ? (isDarkMode ? 'border border-red-500' : 'border border-red-400') 
              : (isDarkMode ? 'border border-slate-700' : 'border border-gray-200')}`}
          placeholder="Add a description so users are more compelled to vote"
          maxLength={VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>* Required fields</p>
    </div>
  );
};

export default PollDetailsStep;