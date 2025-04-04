// components/StepIndicator.tsx
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps = 3 
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[...Array(totalSteps)].map((_, index) => {
          const step = index + 1;
          return (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                }`}
              >
                {currentStep > step ? '✓' : step}
              </div>
              {step < totalSteps && (
                <div className={`w-12 h-1 ${
                  currentStep > step ? 'bg-green-500' : 'bg-gray-600'
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