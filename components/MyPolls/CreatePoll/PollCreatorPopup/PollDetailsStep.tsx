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
}

const PollDetailsStep: React.FC<PollDetailsStepProps> = ({
  formData,
  errors,
  charCounts,
  onInputChange
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
      <h3 className="text-xl font-semibold text-gray-100 mb-4">Poll Details</h3>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="pollTitle" className="block text-gray-300">Poll Title <span className="text-red-500">*</span></label>
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
          className={`w-full bg-gray-700 border ${errors.title ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder={`Title`}
          maxLength={VALIDATION_CONSTRAINTS.TITLE.MAX_LENGTH}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="authorName" className="block text-gray-300">Author Name <span className="text-red-500">*</span></label>
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
          className={`w-full bg-gray-700 border ${errors.author ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder={`Can be your x or instagram username`}
          maxLength={VALIDATION_CONSTRAINTS.AUTHOR.MAX_LENGTH}
        />
        {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="pollLength" className="block text-gray-300 mb-2">Poll Duration <span className="text-red-500">*</span></label>
        <select
          id="pollLength"
          value={formData.pollLength}
          onChange={(e) => handleChange('pollLength', e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="pollDescription" className="block text-gray-300">Description</label>
          <CharacterCounter 
            current={charCounts.description} 
            max={VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} 
          />
        </div>
        <textarea
          id="pollDescription"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full bg-gray-700 border ${errors.description ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]`}
          placeholder={`Add a description so users are more compelled to vote`}
          maxLength={VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <p className="text-gray-400 text-sm">* Required fields</p>
    </div>
  );
};

export default PollDetailsStep;