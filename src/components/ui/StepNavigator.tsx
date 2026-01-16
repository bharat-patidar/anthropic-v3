'use client';

import { useAppStore } from '@/store/useAppStore';
import { Check, FileText, BarChart3, Wrench } from 'lucide-react';

const steps = [
  { id: 'input', label: 'Configure', icon: FileText },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'fixes', label: 'Fixes', icon: Wrench },
] as const;

export function StepNavigator() {
  const { currentStep, goToStep, results, fixes } = useAppStore();

  const getStepStatus = (stepId: typeof steps[number]['id']) => {
    if (stepId === 'input') return 'accessible';
    if (stepId === 'results') return results ? 'accessible' : 'locked';
    if (stepId === 'fixes') return fixes ? 'accessible' : 'locked';
    return 'locked';
  };

  const handleStepClick = (stepId: typeof steps[number]['id']) => {
    const status = getStepStatus(stepId);
    if (status === 'accessible' && currentStep !== 'running') {
      goToStep(stepId);
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isActive = currentStep === step.id;
          const isAccessible = status === 'accessible';
          const isCompleted =
            (step.id === 'input' && results) ||
            (step.id === 'results' && fixes);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible || currentStep === 'running'}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400'
                    : isAccessible
                    ? 'hover:bg-[var(--color-navy-700)] text-[var(--color-slate-300)] cursor-pointer'
                    : 'text-[var(--color-slate-600)] cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500/20 text-green-400'
                      : isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : isAccessible
                      ? 'bg-[var(--color-navy-700)] text-[var(--color-slate-400)]'
                      : 'bg-[var(--color-navy-800)] text-[var(--color-slate-600)]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs opacity-70">
                    {step.id === 'input' && 'Setup analysis'}
                    {step.id === 'results' && 'View insights'}
                    {step.id === 'fixes' && 'Get solutions'}
                  </p>
                </div>
              </button>

              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  getStepStatus(steps[index + 1].id) === 'accessible'
                    ? 'bg-blue-500/30'
                    : 'bg-[var(--color-navy-700)]'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
