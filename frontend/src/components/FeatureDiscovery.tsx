import React, { useState, useEffect } from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  available: boolean;
  comingSoon?: boolean;
}

interface FeatureDiscoveryProps {
  userIntent: string;
  onFeatureEnable: (featureId: string) => void;
}

const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({ userIntent, onFeatureEnable }) => {
  const [discoveredFeatures, setDiscoveredFeatures] = useState<string[]>([]);
  const [showDiscovery, setShowDiscovery] = useState(false);

  const allFeatures: Feature[] = [
    {
      id: 'ewa',
      title: 'Earned Wage Access',
      description: 'Provide employees early access to earned wages',
      icon: '💸',
      available: true
    },
    {
      id: 'social_payments',
      title: 'Social Payments',
      description: 'Group payments and crowdfunding goals',
      icon: '🎯',
      available: true
    },
    {
      id: 'invoicing',
      title: 'Invoicing',
      description: 'Create and manage professional invoices',
      icon: '📄',
      available: true
    },
    {
      id: 'treasury',
      title: 'Treasury Management',
      description: 'Multi-currency wallet and treasury operations',
      icon: '🏛️',
      available: true
    },
    {
      id: 'api_access',
      title: 'API Access',
      description: 'Build custom integrations with our API',
      icon: '⚡',
      available: true
    },
    {
      id: 'ai_automation',
      title: 'AI Automation',
      description: 'Intelligent business process automation',
      icon: '🤖',
      available: false,
      comingSoon: true
    }
  ];

  const getRecommendedFeatures = () => {
    const currentFeatures = getCurrentFeatures();
    return allFeatures.filter(feature => 
      !currentFeatures.includes(feature.id) && 
      feature.available &&
      !discoveredFeatures.includes(feature.id)
    );
  };

  const getCurrentFeatures = () => {
    switch (userIntent) {
      case 'ewa_only':
        return ['ewa', 'payroll'];
      case 'social_only':
        return ['social_payments'];
      case 'api_partner':
        return ['api_access'];
      default:
        return ['ewa', 'social_payments', 'invoicing', 'treasury'];
    }
  };

  useEffect(() => {
    // Show feature discovery after user has been active for a while
    const timer = setTimeout(() => {
      const recommended = getRecommendedFeatures();
      if (recommended.length > 0) {
        setShowDiscovery(true);
      }
    }, 30000); // Show after 30 seconds

    return () => clearTimeout(timer);
  }, [userIntent, discoveredFeatures]);

  const handleDiscoverFeature = (featureId: string) => {
    setDiscoveredFeatures(prev => [...prev, featureId]);
    onFeatureEnable(featureId);
  };

  const handleDismiss = () => {
    setShowDiscovery(false);
  };

  if (!showDiscovery) return null;

  const recommendedFeatures = getRecommendedFeatures();
  if (recommendedFeatures.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Discover New Features</h3>
          <p className="text-sm text-gray-600">Expand your Corridor capabilities</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {recommendedFeatures.slice(0, 2).map((feature) => (
          <div
            key={feature.id}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="text-lg">{feature.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{feature.description}</p>
              <button
                onClick={() => handleDiscoverFeature(feature.id)}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Enable
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default FeatureDiscovery;