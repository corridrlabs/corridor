import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useBilling } from '../hooks/useBilling';
import { Paywall } from './Paywall';
import { Crown, Lock, Sparkles } from 'lucide-react';

interface TierGateProps {
  feature: string;
  currentTier?: 'FREE' | 'PRO' | 'PREMIUM';
  requiredTier: 'PRO' | 'PREMIUM';
  onUpgrade?: () => void;
  children?: React.ReactNode;
}

const TierGate: React.FC<TierGateProps> = ({
  feature,
  requiredTier,
  onUpgrade,
  children
}) => {
  const { isPro, productPlan } = useBilling();
  const [showPaywall, setShowPaywall] = useState(false);

  const tierOrder = { FREE: 0, PRO: 1, PREMIUM: 2 };
  const inferredTier = !isPro
    ? 'FREE'
    : /premium/i.test(productPlan || '')
      ? 'PREMIUM'
      : 'PRO';
  const hasAccess = tierOrder[inferredTier] >= tierOrder[requiredTier];

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setShowPaywall(true);
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  const getFeatureMessage = () => {
    switch (feature) {
      case 'social_goals':
        return 'Create unlimited social goals';
      case 'ewa_employees':
        return 'Add EWA employees';
      case 'api_access':
        return 'Access API features';
      case 'custom_integrations':
        return 'Use custom integrations';
      default:
        return 'Access this feature';
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 text-center">
        <div className="mb-4">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
            {requiredTier === 'PRO' ? (
              <Crown className="w-6 h-6 text-orange-600" />
            ) : (
              <Sparkles className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upgrade to {requiredTier}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {getFeatureMessage()} with {requiredTier} plan
          </p>
        </div>
        
        <Button 
          onClick={handleUpgradeClick}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-lg font-medium"
        >
          Upgrade Now
        </Button>
      </div>

      <Paywall 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
};

export default TierGate;
