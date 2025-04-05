//PollCreatorPopup.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useMappbookUser } from '@/context/UserContext';
import { PollData, PollQuestion, PollOption, ValidationErrors, CharCounts } from './PollCreatorPopup/poll-types';
import { validatePollDetails, validatePollQuestions } from './PollCreatorPopup/poll-validation';

import { ToastMessage } from '../ToastMessage';
import { X, ArrowLeft, Check, Loader2 } from 'lucide-react';

import StepIndicator from './PollCreatorPopup/StepIndicator';
import PollDetailsStep from './PollCreatorPopup/PollDetailsStep';
import QuestionsStep from './PollCreatorPopup/QuestionsStep';
import SummaryStep from './PollCreatorPopup/SummaryStep';

interface PollCreatorPopupProps {
  onClose: () => void;
  onSave: (data: PollData, generateUrl: boolean) => void;
  isDarkMode: boolean;
}

const PollCreatorPopup: React.FC<PollCreatorPopupProps> = ({
  onClose,
  onSave,
  isDarkMode
}) => {
  const { mappbookUser } = useMappbookUser();
  
  // Current step in the form flow
  const [currentStep, setCurrentStep] = useState<number>(1);

  const generateShortId = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  // Local form data
  const [formData, setFormData] = useState<PollData>({
    title: '',
    description: '',
    author: '',
    pollLength: '3',
    questions: [{ 
      id: generateShortId(),
      text: '', 
      options: [
        { id: generateShortId(), text: '' },
        { id: generateShortId(), text: '' }
      ] 
    }],
    mappbook_user_id: mappbookUser?.mappbook_user_id || '',
    url: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupHeight, setPopupHeight] = useState<number | null>(null);
  
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
        options: q.options.map(o => o.text.length)
      }))
    };
    setCharCounts(newCharCounts);
  }, [formData]);

  // Update popup height when window resizes
  useEffect(() => {
    const updateHeight = () => {
      // Use the CSS variable for viewport height set by ViewportHandler
      const vh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vh')) || window.innerHeight * 0.01;
      setPopupHeight(vh * 100 * 0.95); // 95% of viewport height to maximize content space
    };

    // Initial update
    updateHeight();

    // Update on resize
    window.addEventListener('resize', updateHeight);
    
    // Prevent body scrolling when popup is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      document.body.style.overflow = '';
    };
  }, []);

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
        options: q.options.map(o => o.text.length)
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
      const response = await fetch('/api/polls/create-poll', {
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
        }, 2000); // Give 2 seconds for the toast to be visible before closing
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
            isDarkMode={isDarkMode}
          />
        );
      case 2:
        return (
          <QuestionsStep
            formData={formData}
            errors={errors}
            charCounts={charCounts}
            updateQuestions={updateQuestions}
            isDarkMode={isDarkMode}
          />
        );
      case 3:
        return <SummaryStep formData={formData} isDarkMode={isDarkMode} />;
      default:
        return null;
    }
  };

  // Render navigation buttons
  const renderNavigation = () => {
    return (
      <div className="flex justify-between mt-3 mb-1">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className={`flex items-center gap-1.5 transition-all duration-300 font-medium px-4 py-2 rounded-lg text-sm
              ${isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className={`transition-all duration-300 font-medium px-4 py-2 rounded-lg text-sm
              ${isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            Cancel
          </button>
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className={`transition-all duration-300 font-medium px-4 py-2 rounded-lg text-sm
              ${isDarkMode 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveAndGenerate}
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-1.5 transition-all duration-300 font-medium px-4 py-2 rounded-lg text-sm
              ${isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:opacity-60' 
                : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300 disabled:opacity-60'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save & Generate URL</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className={`w-11/12 max-w-2xl mx-auto rounded-xl shadow-2xl overflow-hidden h-screen-dynamic max-h-screen-dynamic
          ${isDarkMode 
            ? 'bg-slate-900 border border-slate-700 shadow-indigo-900/10' 
            : 'bg-white border border-gray-200 shadow-gray-300/20'}`}
        style={{
          maxHeight: popupHeight ? `${popupHeight}px` : '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className={`py-2 px-4 flex justify-between items-center
          ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200'}`}>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {currentStep === 1 ? 'Create New Poll' :
             currentStep === 2 ? 'Add Questions' :
             'Finalize Your Poll'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1 transition-colors
              ${isDarkMode 
                ? 'hover:bg-slate-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-2 pb-4 flex-1 flex flex-col overflow-hidden">
          <StepIndicator currentStep={currentStep} isDarkMode={isDarkMode} />

          <div className="mt-3 mb-4 flex-1 overflow-y-auto px-1 no-scrollbar">
            {renderCurrentStep()}
          </div>

          <div className="mt-auto">
            {renderNavigation()}
          </div>
        </div>
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