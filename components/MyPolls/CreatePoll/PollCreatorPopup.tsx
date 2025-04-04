//PollCreatorPopup.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { PollData, PollQuestion, ValidationErrors, CharCounts } from './PollCreatorPopup/poll-types';
import { validatePollDetails, validatePollQuestions } from './PollCreatorPopup/poll-validation';
import { ToastMessage } from '../ToastMessage';

import StepIndicator from './PollCreatorPopup/StepIndicator';
import PollDetailsStep from './PollCreatorPopup/PollDetailsStep';
import QuestionsStep from './PollCreatorPopup/QuestionsStep';
import SummaryStep from './PollCreatorPopup/SummaryStep';

interface PollCreatorPopupProps {
  onClose: () => void;
  onSave: (data: PollData, generateUrl: boolean) => void;
}

const PollCreatorPopup: React.FC<PollCreatorPopupProps> = ({
  onClose,
  onSave
}) => {
  const { mappbookUser } = useMappbookUser();
  
  // Current step in the form flow
  const [currentStep, setCurrentStep] = useState<number>(1);

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
  
  // Toast notification state
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' as 'success' | 'error' 
  });

  // Character count states
  const [charCounts, setCharCounts] = useState<CharCounts>({
    title: 0,
    description: 0,
    author: 0,
    questions: [{ text: 0, options: [0, 0] }]
  });

  // Validation states
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Update character counts when form data changes
  useEffect(() => {
    const newCharCounts: CharCounts = {
      title: formData.title.length,
      description: formData.description.length,
      author: formData.author.length,
      questions: formData.questions.map(q => ({
        text: q.text.length,
        options: q.options.map(o => o.length)
      }))
    };
    setCharCounts(newCharCounts);
  }, [formData]);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  // Hide toast message
  const hideToast = () => {
    setToast({ visible: false, message: '', type: 'success' });
  };

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

  // Handle questions update from the QuestionsStep component
  const updateQuestions = (questions: PollQuestion[]) => {
    setFormData(prev => ({
      ...prev,
      questions
    }));
    
    // Update character counts for questions
    setCharCounts(prev => ({
      ...prev,
      questions: questions.map(q => ({
        text: q.text.length,
        options: q.options.map(o => o.length)
      }))
    }));
    
    // Clear question errors if any
    if (errors.questions) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.questions;
        return updated;
      });
    }
  };
  
  // Validate steps
  const validateStep1 = (): boolean => {
    const validationErrors = validatePollDetails(formData);
    setErrors(prev => ({ ...prev, ...validationErrors }));
    return Object.keys(validationErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const validationErrors = validatePollQuestions(formData);
    setErrors(prev => ({ ...prev, ...validationErrors }));
    return Object.keys(validationErrors).length === 0;
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
        showToast('Please check your form for errors before saving.', 'error');
        return;
      }
      
      // Make sure we have the mappbook_user_id
      if (!mappbookUser?.mappbook_user_id) {
        showToast('User profile not loaded. Please try again in a moment.', 'error');
        return;
      }
      
      // Include user ID in form data
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
        showToast('Poll created successfully!', 'success');
        setTimeout(() => {
          try {
            onSave(dataToSubmit, true);
          } catch (error) {
            console.error('Error in onSave callback:', error);
            onSave(dataToSubmit, true);
          }
        }, 2000); // Give 1 second for the toast to be visible before closing
      } else {
        throw new Error(result.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error saving poll:', error);
      showToast(`There was an error saving your poll: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      setIsSubmitting(false);
    }
  };
  
  // Render current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PollDetailsStep 
            formData={formData}
            errors={errors}
            charCounts={charCounts}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <QuestionsStep
            formData={formData}
            errors={errors}
            charCounts={charCounts}
            updateQuestions={updateQuestions}
          />
        );
      case 3:
        return <SummaryStep formData={formData} />;
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
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto relative">
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

        <StepIndicator currentStep={currentStep} />

        <div className="mb-6">
          {renderCurrentStep()}
        </div>

        {renderNavigation()}
      </div>
      
      {toast.visible && (
        <div className="z-[100]">
          <ToastMessage
            message={toast.message}
            isVisible={toast.visible}
            onClose={hideToast}
            duration={2000}
            type={toast.type}
          />
        </div>
      )}
    </div>
  );
};

export default PollCreatorPopup;