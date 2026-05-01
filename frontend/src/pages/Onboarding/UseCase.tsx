import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

const useCases: UseCase[] = [
  {
    id: 'ewa_only',
    title: 'Earned Wage Access',
    description: 'Provide employees early access to earned wages',
    icon: '💸',
    features: ['Employee management', 'Advance requests', 'Payroll integration']
  },
  {
    id: 'social_only',
    title: 'Social Payments',
    description: 'Group payments, goals, and social fundraising',
    icon: '🎯',
    features: ['Crowdfunding goals', 'Split payments', 'Social feed']
  },
  {
    id: 'full_platform',
    title: 'Full Platform',
    description: 'Complete business orchestration suite',
    icon: '🏢',
    features: ['All features', 'Treasury management', 'AI automation']
  },
  {
    id: 'api_partner',
    title: 'API Integration',
    description: 'Build on top of Corridor infrastructure',
    icon: '⚡',
    features: ['API access', 'Webhooks', 'Developer tools']
  }
];

const UseCase: React.FC = () => {
  const navigate = useNavigate();
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

  const toggleUseCase = (id: string) => {
    setSelectedUseCases(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedUseCases.length === 0) return;
    
    // Store selection in localStorage for now
    localStorage.setItem('onboarding_intent', selectedUseCases[0]);
    
    // Navigate based on selection
    if (selectedUseCases.includes('ewa_only') || selectedUseCases.includes('api_partner')) {
      navigate('/onboarding/business-info');
    } else {
      navigate('/onboarding/payment-setup');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">What brings you to Corridor?</h1>
          <p className="text-gray-600">Select your primary use case (you can choose multiple)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              onClick={() => toggleUseCase(useCase.id)}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                selectedUseCases.includes(useCase.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{useCase.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.description}</p>
                  <ul className="space-y-1">
                    {useCase.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedUseCases.includes(useCase.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedUseCases.includes(useCase.id) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate('/onboarding/welcome')}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={selectedUseCases.length === 0}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseCase;