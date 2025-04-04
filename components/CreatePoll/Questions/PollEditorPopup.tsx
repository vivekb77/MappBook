'use client';

import React, { useState, useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';

// Define prop types for better type safety
interface PollQuestion {
    text: string;
    options: string[];
}


// Update the PollData interface to include mappbook_user_id
interface PollData {
  title: string;
  description: string;
  author: string;
  pollLength: string;
  questions: PollQuestion[];
  mappbook_user_id?: string;
  url?: string;
}

interface PollEditorPopupProps {
    onClose: () => void;
    onSave: (data: PollData, generateUrl: boolean) => void;
}

const PollEditorPopup: React.FC<PollEditorPopupProps> = ({
    onClose,
    onSave
}) => {
    const { mappbookUser } = useMappbookUser();
    // Current step in the form flow
    const [currentStep, setCurrentStep] = useState<number>(1);

    // Local form data
   // Local form data
  const [formData, setFormData] = useState<PollData>({
    title: '',
    description: '',
    author: '',
    pollLength: '3',
    questions: [{ text: '', options: ['', ''] }],
    mappbook_user_id: mappbookUser?.mappbook_user_id || '',
    url: ''
  });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation states
    const [errors, setErrors] = useState<{
        title?: string;
        author?: string;
        questions?: string[];
    }>({});

    // Form field handlers
    const handleInputChange = (field: keyof PollData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear any errors for this field
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[field as keyof typeof errors];
                return updated;
            });
        }
    };

    // Handle question changes
    const handleQuestionTextChange = (index: number, value: string) => {
        const updatedQuestions = [...formData.questions];
        if (updatedQuestions[index]) {
            updatedQuestions[index].text = value;
            setFormData(prev => ({
                ...prev,
                questions: updatedQuestions
            }));

            // Clear any errors for this question
            if (errors.questions && errors.questions[index]) {
                const updatedErrors = { ...errors };
                if (updatedErrors.questions) {
                    updatedErrors.questions[index] = '';
                }
                setErrors(updatedErrors);
            }
        }
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updatedQuestions = [...formData.questions];
        if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options)) {
            updatedQuestions[qIndex].options[oIndex] = value;
            setFormData(prev => ({
                ...prev,
                questions: updatedQuestions
            }));
        }
    };

    const addOption = (qIndex: number) => {
        const updatedQuestions = [...formData.questions];
        if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options) &&
            updatedQuestions[qIndex].options.length < 4) {
            updatedQuestions[qIndex].options.push('');
            setFormData(prev => ({
                ...prev,
                questions: updatedQuestions
            }));
        }
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const updatedQuestions = [...formData.questions];
        if (updatedQuestions[qIndex] && Array.isArray(updatedQuestions[qIndex].options) &&
            updatedQuestions[qIndex].options.length > 2) {
            updatedQuestions[qIndex].options.splice(oIndex, 1);
            setFormData(prev => ({
                ...prev,
                questions: updatedQuestions
            }));
        }
    };

    const addQuestion = () => {
        if (formData.questions.length < 3) {
            setFormData(prev => ({
                ...prev,
                questions: [...prev.questions, { text: '', options: ['', ''] }]
            }));
        }
    };

    const removeQuestion = (index: number) => {
        if (formData.questions.length > 1) {
            const updatedQuestions = [...formData.questions];
            updatedQuestions.splice(index, 1);
            setFormData(prev => ({
                ...prev,
                questions: updatedQuestions
            }));
        }
    };

    // Validate individual steps
    const validateStep1 = (): boolean => {
        const newErrors: { title?: string; author?: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Poll title is required';
        }

        if (!formData.author.trim()) {
            newErrors.author = 'Author name is required';
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: { questions?: string[] } = { questions: [] };
        let isValid = true;

        formData.questions.forEach((question, index) => {
            if (!question.text.trim()) {
                if (!newErrors.questions) newErrors.questions = [];
                newErrors.questions[index] = 'Question text is required';
                isValid = false;
            }

            // Check if at least 2 options have values
            const filledOptions = question.options.filter(opt => opt.trim().length > 0);
            if (filledOptions.length < 2) {
                if (!newErrors.questions) newErrors.questions = [];
                newErrors.questions[index] = 'At least 2 options are required';
                isValid = false;
            }
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };

    // Navigate between steps
    const handleNext = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCurrentStep(3);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSaveAndGenerate = async () => {
        try {
          // Validate the form data first
          if (!validateStep2()) {
            alert('Please check your form for errors before saving.');
            return;
          }
          
          // Make sure we have the mappbook_user_id
          if (!mappbookUser?.mappbook_user_id) {
            alert('User profile not loaded. Please try again in a moment.');
            return;
          }
          
          // Ensure the mappbook_user_id is included in the form data
          const dataToSubmit = {
            ...formData,
            mappbook_user_id: mappbookUser.mappbook_user_id
          };
          
          // Show submitting state
          setIsSubmitting(true);
          
          // Send data to the API
          const response = await fetch('/api/create-polls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSubmit)
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            // Generate a URL from the poll ID
            const pollUrl =  `https://mappbook.com/answer-poll${result.poll_id}`;
            
            // Copy URL to clipboard
            try {
              await navigator.clipboard.writeText(pollUrl);
              // Call the parent component's onSave function
              onSave(dataToSubmit, true);
            } catch (clipboardError) {
              console.error('Failed to copy to clipboard:', clipboardError);
              alert(`Poll created successfully! Your poll URL is: ${pollUrl}`);
              onSave(dataToSubmit, true);
            }
          } else {
            throw new Error(result.error || 'Failed to create poll');
          }
        } catch (error) {
          console.error('Error saving poll:', error);
          alert(`There was an error saving your poll: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsSubmitting(false);
        }
      };


    // Render steps
    const renderPollDetails = () => {
        return (
            <div>
                <h3 className="text-xl font-semibold text-gray-100 mb-4">Poll Details</h3>

                <div className="mb-4">
                    <label htmlFor="pollTitle" className="block text-gray-300 mb-2">Poll Title: <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="pollTitle"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`w-full bg-gray-700 border ${errors.title ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., Favorite Movie Genre"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="authorName" className="block text-gray-300 mb-2">Author Name: <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="authorName"
                        value={formData.author}
                        onChange={(e) => handleInputChange('author', e.target.value)}
                        className={`w-full bg-gray-700 border ${errors.author ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Your name"
                    />
                    {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
                </div>

                <div className="mb-4">
                    <label htmlFor="pollLength" className="block text-gray-300 mb-2">Poll Duration: <span className="text-red-500">*</span></label>
                    <select
                        id="pollLength"
                        value={formData.pollLength}
                        onChange={(e) => handleInputChange('pollLength', e.target.value)}
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
                    <label htmlFor="pollDescription" className="block text-gray-300 mb-2">Description:</label>
                    <textarea
                        id="pollDescription"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="Add more details to help users understand what this poll is about..."
                    />
                </div>

                <p className="text-gray-400 text-sm">* Required fields</p>
            </div>
        );
    };

    const renderQuestionsEditor = () => {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-100">Poll Questions</h3>
                    {formData.questions.length < 3 && (
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
                                {formData.questions.length > 1 && (
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
                                <label htmlFor={`question-${qIndex}`} className="block text-gray-300 mb-2">Question Text:</label>
                                <input
                                    type="text"
                                    id={`question-${qIndex}`}
                                    value={question.text}
                                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                    className={`w-full bg-gray-800 border ${errors.questions && errors.questions[qIndex] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    placeholder="Enter your question here"
                                />
                                {errors.questions && errors.questions[qIndex] && (
                                    <p className="text-red-500 text-sm mt-1">{errors.questions[qIndex]}</p>
                                )}
                            </div>

                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-gray-300">Options:</label>
                                    {Array.isArray(question.options) && question.options.length < 4 && (
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
                                            <input
                                                type="text"
                                                value={option || ''}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder={`Option ${oIndex + 1}`}
                                            />
                                            {Array.isArray(question.options) && question.options.length > 2 && (
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
                                Options 1 and 2 are required, additional options are optional.
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSummary = () => {
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
                    After saving, your poll will be stored in the database and a unique URL will be generated for sharing.
                    You'll find your poll in the "My Polls" section.
                </p>
            </div>
        );
    };

    // Step indicator component
    const StepIndicator = () => {
        return (
            <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-2">
                    {[1, 2, 3].map((step) => (
                        <React.Fragment key={step}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step
                                        ? 'bg-blue-600 text-white'
                                        : currentStep > step
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-600 text-gray-300'
                                    }`}
                            >
                                {currentStep > step ? '✓' : step}
                            </div>
                            {step < 3 && (
                                <div className={`w-12 h-1 ${currentStep > step ? 'bg-green-500' : 'bg-gray-600'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    // Render current step
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return renderPollDetails();
            case 2:
                return renderQuestionsEditor();
            case 3:
                return renderSummary();
            default:
                return null;
        }
    };

    // Render navigation buttons
    const renderNavigation = () => {
        return (
            <div className="flex justify-between mt-6">
                {currentStep > 1 ? (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg"
                    >
                        Back
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                )}

                {currentStep < 3 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSaveAndGenerate}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            'Save & Generate URL'
                        )}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-100">
                        {currentStep === 1 ? 'Create New Poll' :
                            currentStep === 2 ? 'Add Questions' :
                                'Finalize Your Poll'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 text-xl"
                    >
                        ✕
                    </button>
                </div>

                <StepIndicator />

                <div className="mb-6">
                    {renderStep()}
                </div>

                {renderNavigation()}
            </div>
        </div>
    );
};

export default PollEditorPopup;
