import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

interface DashboardTourProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
  onStepChange?: (targetId: string) => void;
}

interface TourStep {
  title: string;
  description: string;
  targetId: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Command Center',
    description:
      'This is your operating dashboard. Everything starts here: cash, people, automations, and growth.',
    targetId: 'tour-command-center',
  },
  {
    title: 'Primary Stats',
    description:
      'Track core KPIs like liquidity, workflows, and team velocity at a glance.',
    targetId: 'tour-primary-stats',
  },
  {
    title: 'Finance Hub',
    description:
      'Use this for invoices, treasury, cards, and payout operations.',
    targetId: 'tour-finance-hub',
  },
  {
    title: 'People Hub',
    description:
      'Manage payroll, EWA, team operations, and employee onboarding.',
    targetId: 'tour-people-hub',
  },
  {
    title: 'Automation Studio',
    description:
      'Launch automations, connect rails, and orchestrate payment workflows.',
    targetId: 'tour-automation-hub',
  },
  {
    title: 'Activity Feed',
    description:
      'See live events and operational history for quick monitoring.',
    targetId: 'tour-activity-feed',
  },
  {
    title: 'Customize and Reopen Tour',
    description:
      'Use the Customize button on Dashboard and the Workspace tab in Settings to tune layout and replay this tour anytime.',
    targetId: 'tour-customize-button',
  },
];

export const DashboardTour: React.FC<DashboardTourProps> = ({ open, onClose, onFinish, onStepChange }) => {
  const [index, setIndex] = useState(0);
  const step = useMemo(() => TOUR_STEPS[index], [index]);
  const lastStep = index === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    onStepChange?.(step.targetId);
    const element = document.getElementById(step.targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [index, open, onStepChange, step.targetId]);

  if (!open) return null;

  const next = () => {
    if (lastStep) {
      onFinish();
      return;
    }
    setIndex((prev) => prev + 1);
  };

  const back = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[120] w-[calc(100%-2.5rem)] max-w-xl">
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Product Tour
            </p>
            <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="text-slate-600 leading-relaxed">{step.description}</p>
          <div className="mt-5 flex items-center gap-2">
            {TOUR_STEPS.map((_, dotIndex) => (
              <div
                key={dotIndex}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index ? 'w-8 bg-blue-600' : 'w-3 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Skip Tour
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={back}
              disabled={index === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
            >
              {lastStep ? 'Finish' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
