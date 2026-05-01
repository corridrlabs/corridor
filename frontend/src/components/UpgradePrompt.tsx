import React from 'react';
import { Crown, X } from 'lucide-react';
import { Button } from './ui/Button';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
  onUpgrade?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  feature,
  message,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-orange-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Upgrade Required
          </h2>

          <p className="text-slate-600 dark:text-slate-300 mb-2">
            {message || `Access to ${feature || 'this feature'} requires a Pro subscription.`}
          </p>

          <p className="text-sm text-slate-400 dark:text-slate-400 mb-6">
            Unlock Premium features and API access with Pro plan.
          </p>

          <div className="space-y-3">
            <Button
              onClick={onUpgrade || (() => window.location.href = '/subscription')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-semibold"
            >
              <Crown className="w-5 h-5 inline-block mr-2" />
              Upgrade to Pro
            </Button>

            <button
              onClick={onClose}
              className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};