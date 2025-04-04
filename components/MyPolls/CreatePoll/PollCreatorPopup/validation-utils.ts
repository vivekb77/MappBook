// utils/validation-utils.ts
export const VALIDATION_CONSTRAINTS = {
    TITLE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 100,
    },
    AUTHOR: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 25,
    },
    DESCRIPTION: {
      MAX_LENGTH: 180, // Twitter-like character limit
    },
    QUESTION: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 100, // Twitter poll question length
    },
    OPTION: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 25, // Twitter poll option length
    },
    MAX_OPTIONS: 4,
    MIN_OPTIONS: 2,
    MAX_QUESTIONS: 3,
    MIN_QUESTIONS: 1,
  };
  
  // Safe sanitize function - only removes HTML tags, preserves all spaces
  export const safeRemoveHTML = (input: string): string => {
    if (!input) return '';
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove JavaScript protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };