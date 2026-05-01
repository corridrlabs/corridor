import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardPreview {
  layout: string;
  features: string[];
  widgets: string[];
}

const Complete: React.FC = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<DashboardPreview | null>(null);

  useEffect(() => {
    const intent = localStorage.getItem('onboarding_intent') || 'full_platform';
    
    // Generate preview based on intent
    const previews: Record<string, DashboardPreview> = {
      ewa_only: {
        layout: 'EWA-focused',
        features: ['Employee Management', 'Advance Requests', 'Payroll Integration'],
        widgets: ['Employee List', 'Pending Advances', 'Payroll Summary']
      },
      social_only: {
        layout: 'Social-focused',
        features: ['Crowdfunding Goals', 'Split Payments', 'Social Feed'],
        widgets: ['Active Goals', 'Recent Splits', 'Social Activity']
      },
      api_partner: {
        layout: 'Developer-focused',
        features: ['API Keys', 'Webhooks', 'Documentation'],
        widgets: ['API Usage', 'Webhook Logs', 'Rate Limits']
      },
      full_platform: {
        layout: 'Full Platform',
        features: ['All Features', 'Treasury Management', 'AI Automation'],
        widgets: ['Balance Overview', 'Recent Transactions', 'Quick Actions']
      }
    };

    setPreview(previews[intent] || previews.full_platform);
  }, []);

  const handleFinish = async () => {
    try {
      // Send onboarding data to backend
      const intent = localStorage.getItem('onboarding_intent');
      const businessInfo = localStorage.getItem('onboarding_business_info');
      const paymentMethod = localStorage.getItem('onboarding_payment_method');

      const response = await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          step: 'complete',
          data: {
            intent,
            business_info: businessInfo,
            payment_method: paymentMethod
          }
        })
      });

      if (response.ok) {
        // Clear onboarding data
        localStorage.removeItem('onboarding_intent');
        localStorage.removeItem('onboarding_business_info');
        localStorage.removeItem('onboarding_payment_method');
        
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      navigate('/dashboard');
    }
  };

  if (!preview) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-2xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set!</h1>
          <p className="text-gray-600">Here's a preview of your personalized dashboard</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{preview.layout} Dashboard</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Enabled Features</h3>
              <div className="space-y-2">
                {preview.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Dashboard Widgets</h3>
              <div className="space-y-2">
                {preview.widgets.map((widget, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">{widget}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-lg">💡</span>
            <div>
              <h4 className="font-medium text-blue-900">What's next?</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Explore your personalized dashboard</li>
                <li>• Complete your profile setup</li>
                <li>• Discover additional features as you grow</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleFinish}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Complete;