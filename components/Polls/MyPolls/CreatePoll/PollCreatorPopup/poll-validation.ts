// poll-validation.ts
import { PollData, ValidationErrors } from './poll-types';
import { VALIDATION_CONSTRAINTS } from './validation-utils';

// Validate poll details (Step 1)
export const validatePollDetails = (formData: PollData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate title
  if (!formData.title.trim()) {
    errors.title = 'Poll title is required';
  } else if (formData.title.trim().length < VALIDATION_CONSTRAINTS.TITLE.MIN_LENGTH) {
    errors.title = `Title must be at least ${VALIDATION_CONSTRAINTS.TITLE.MIN_LENGTH} characters`;
  }

  // Validate author
  if (!formData.author.trim()) {
    errors.author = 'Author name is required';
  } else if (formData.author.trim().length < VALIDATION_CONSTRAINTS.AUTHOR.MIN_LENGTH) {
    errors.author = `Author name must be at least ${VALIDATION_CONSTRAINTS.AUTHOR.MIN_LENGTH} characters`;
  }

  // Validate description (optional field)
  if (formData.description && formData.description.length > VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH) {
    errors.description = `Description cannot exceed ${VALIDATION_CONSTRAINTS.DESCRIPTION.MAX_LENGTH} characters`;
  }

  return errors;
};

// Validate questions and options (Step 2)
export const validatePollQuestions = (formData: PollData): ValidationErrors => {
  const errors: ValidationErrors = { questions: [] };
  let isValid = true;

  formData.questions.forEach((question, index) => {
    // Validate question text
    if (!question.text.trim()) {
      if (!errors.questions) errors.questions = [];
      errors.questions[index] = 'Question text is required';
      isValid = false;
    } else if (question.text.trim().length < VALIDATION_CONSTRAINTS.QUESTION.MIN_LENGTH) {
      if (!errors.questions) errors.questions = [];
      errors.questions[index] = `Question must be at least ${VALIDATION_CONSTRAINTS.QUESTION.MIN_LENGTH} characters`;
      isValid = false;
    }

    // Check if at least 2 options have values
    const filledOptions = question.options.filter(opt => opt.text.trim().length > 0);
    
    if (filledOptions.length < VALIDATION_CONSTRAINTS.MIN_OPTIONS) {
      if (!errors.questions) errors.questions = [];
      errors.questions[index] = `At least ${VALIDATION_CONSTRAINTS.MIN_OPTIONS} options are required`;
      isValid = false;
    } else {
      // Validate option lengths
      const invalidOptions = question.options.filter(
        opt => opt.text.trim().length > 0 && 
        (opt.text.length > VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH ||
         opt.text.length < VALIDATION_CONSTRAINTS.OPTION.MIN_LENGTH)
      );
      
      if (invalidOptions.length > 0) {
        if (!errors.questions) errors.questions = [];
        errors.questions[index] = `Options must be between ${VALIDATION_CONSTRAINTS.OPTION.MIN_LENGTH} and ${VALIDATION_CONSTRAINTS.OPTION.MAX_LENGTH} characters`;
        isValid = false;
      }
    }
  });

  if (isValid) {
    return {};
  }
  
  return errors;
};