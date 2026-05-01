import React, { useState } from 'react';
import { Share2, Copy, MessageCircle, Twitter, Mail, Check } from 'lucide-react';

interface ShareGoalProps {
  goal: {
    id: string;
    title: string;
    description: string;
    amount: number;
    raised: number;
    currency: string;
    share_link: string;
  };
  onClose?: () => void;
}

const ShareGoal: React.FC<ShareGoalProps> = ({ goal, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Help me reach my goal: ${goal.title}! ${goal.raised}/${goal.amount} ${goal.currency} raised so far. Every contribution counts! 🎯`;
  const shareUrl = goal.share_link;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Help me reach my goal: ${goal.title}`);
    const body = encodeURIComponent(`Hi!\n\nI'm raising money for: ${goal.title}\n\n${goal.description}\n\nI've raised ${goal.raised} out of ${goal.amount} ${goal.currency} so far. Every contribution helps!\n\nYou can contribute here: ${shareUrl}\n\nThanks for your support!`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Share Goal</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{goal.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-green-600">
              {goal.raised} {goal.currency} raised
            </span>
            <span className="text-gray-500">
              of {goal.amount} {goal.currency}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            <span className="font-medium">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>

          <button
            onClick={shareViaWhatsApp}
            className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">Share on WhatsApp</span>
          </button>

          <button
            onClick={shareViaTwitter}
            className="w-full flex items-center gap-3 p-3 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors"
          >
            <Twitter className="h-5 w-5" />
            <span className="font-medium">Share on Twitter</span>
          </button>

          <button
            onClick={shareViaEmail}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span className="font-medium">Share via Email</span>
          </button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 text-center">
            Share your goal to reach more supporters and achieve your target faster!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareGoal;