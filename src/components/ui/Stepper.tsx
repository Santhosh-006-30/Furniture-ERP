import React from 'react';

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`w-full flex items-center justify-between gap-2 md:gap-4 select-none ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={idx}>
            {/* Step trigger bubble */}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : isActive
                    ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {idx + 1}
              </div>
              <div className="hidden sm:block">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-sky-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.label}
                </p>
                {step.description && <p className="text-[10px] text-slate-500">{step.description}</p>}
              </div>
            </div>

            {/* Stepper Connector Line */}
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-all rounded-full ${
                  idx < currentStep ? 'bg-emerald-500/80' : 'bg-slate-800'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
