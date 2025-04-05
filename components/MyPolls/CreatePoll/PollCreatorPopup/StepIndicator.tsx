// components/StepIndicator.tsx
import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  isDarkMode: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps = 3,
  isDarkMode
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[...Array(totalSteps)].map((_, index) => {
          const step = index + 1;
          return (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  currentStep === step
                    ? (isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                    : currentStep > step
                      ? (isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                      : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                }`}
              >
                {currentStep > step ? <Check size={16} /> : step}
              </div>
              {step < totalSteps && (
                <div className={`w-12 h-1 rounded-full transition-colors ${
                  currentStep > step 
                    ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                    : (isDarkMode ? 'bg-slate-700' : 'bg-gray-200')
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;