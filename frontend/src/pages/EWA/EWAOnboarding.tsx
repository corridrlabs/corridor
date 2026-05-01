import React, { useState } from 'react';
import { Users, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function EWAOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orgType, setOrgType] = useState<'employer' | 'employee' | null>(null);
  
  const employerSteps: OnboardingStep[] = [
    {
      id: 'setup',
      title: 'Organization Setup',
      description: 'Configure your EWA settings and advance limits',
      completed: false
    },
    {
      id: 'employees',
      title: 'Import Employees',
      description: 'Upload employee roster or connect your ERP system',
      completed: false
    },
    {
      id: 'integration',
      title: 'ERP Integration',
      description: 'Connect Workday, BambooHR, or other HR systems',
      completed: false
    },
    {
      id: 'launch',
      title: 'Launch EWA',
      description: 'Activate EWA for your employees',
      completed: false
    }
  ];

  const employeeSteps: OnboardingStep[] = [
    {
      id: 'verify',
      title: 'Verify Identity',
      description: 'Confirm your employment and identity',
      completed: false
    },
    {
      id: 'bank',
      title: 'Add Bank Account',
      description: 'Connect your bank account for advances',
      completed: false
    },
    {
      id: 'ready',
      title: 'Ready to Use',
      description: 'Start accessing your earned wages',
      completed: false
    }
  ];

  const steps = orgType === 'employer' ? employerSteps : employeeSteps;

  const selectUserType = (type: 'employer' | 'employee') => {
    setOrgType(type);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const completeOnboarding = () => {
    // Redirect to appropriate dashboard
    if (orgType === 'employer') {
      window.location.href = '/ewa/admin';
    } else {
      window.location.href = '/ewa/employee';
    }
  };

  if (!orgType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Welcome to Corridor EWA</h1>
            <p className="text-gray-600">
              Access earned wages instantly, reduce financial stress, and improve cash flow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employer Option */}
            <div 
              onClick={() => selectUserType('employer')}
              className="bg-white p-8 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <Users className="mx-auto mb-4 text-blue-600" size={48} />
                <h2 className="text-xl font-semibold mb-2">I'm an Employer</h2>
                <p className="text-gray-600 mb-4">
                  Set up EWA for your employees and manage advance settings
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Import employee data</li>
                  <li>• Connect ERP systems</li>
                  <li>• Configure advance limits</li>
                  <li>• Monitor usage analytics</li>
                </ul>
              </div>
            </div>

            {/* Employee Option */}
            <div 
              onClick={() => selectUserType('employee')}
              className="bg-white p-8 rounded-lg shadow border cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="text-center">
                <DollarSign className="mx-auto mb-4 text-green-600" size={48} />
                <h2 className="text-xl font-semibold mb-2">I'm an Employee</h2>
                <p className="text-gray-600 mb-4">
                  Access your earned wages before corridor
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• View earned amount</li>
                  <li>• Request instant advances</li>
                  <li>• Track repayment schedule</li>
                  <li>• No hidden fees</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">
              {orgType === 'employer' ? 'Employer' : 'Employee'} Setup
            </h1>
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle size={16} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {orgType === 'employer' && (
            <EmployerStepContent 
              step={steps[currentStep]} 
              onNext={nextStep}
              onComplete={completeOnboarding}
              isLastStep={currentStep === steps.length - 1}
            />
          )}
          
          {orgType === 'employee' && (
            <EmployeeStepContent 
              step={steps[currentStep]} 
              onNext={nextStep}
              onComplete={completeOnboarding}
              isLastStep={currentStep === steps.length - 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmployerStepContent({ step, onNext, onComplete, isLastStep }: {
  step: OnboardingStep;
  onNext: () => void;
  onComplete: () => void;
  isLastStep: boolean;
}) {
  const [advanceLimit, setAdvanceLimit] = useState(50);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  switch (step.id) {
    case 'setup':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Organization Setup</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Advance Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={advanceLimit}
                  onChange={(e) => setAdvanceLimit(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-center">{advanceLimit}%</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Employees can advance up to {advanceLimit}% of their earned wages
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Pay Frequency</label>
              <select className="w-full border rounded px-3 py-2">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      );

    case 'employees':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Import Employees</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Users className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 mb-4">Upload employee CSV or connect your ERP system</p>
              <div className="space-x-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Upload CSV
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  Connect ERP
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      );

    case 'integration':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">ERP Integration (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Workday', 'BambooHR', 'SAP', 'ADP'].map((system) => (
              <div key={system} className="border rounded p-4 text-center">
                <h3 className="font-medium">{system}</h3>
                <button className="mt-2 bg-gray-600 text-white px-3 py-1 rounded text-sm">
                  Connect
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      );

    case 'launch':
      return (
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
          <h2 className="text-xl font-semibold mb-4">Ready to Launch!</h2>
          <p className="text-gray-600 mb-6">
            Your EWA system is configured and ready for employees to use.
          </p>
          
          <button
            onClick={handleNext}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
          >
            Launch EWA Dashboard
          </button>
        </div>
      );

    default:
      return null;
  }
}

function EmployeeStepContent({ step, onNext, onComplete, isLastStep }: {
  step: OnboardingStep;
  onNext: () => void;
  onComplete: () => void;
  isLastStep: boolean;
}) {
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  switch (step.id) {
    case 'verify':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Employee ID</label>
              <input
                type="text"
                placeholder="Enter your employee ID"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Work Email</label>
              <input
                type="email"
                placeholder="your.email@company.com"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Verify Identity
          </button>
        </div>
      );

    case 'bank':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Add Bank Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Routing Number</label>
              <input
                type="text"
                placeholder="Enter routing number"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          
          <button
            onClick={handleNext}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Verify Bank Account
          </button>
        </div>
      );

    case 'ready':
      return (
        <div className="text-center">
          <Clock className="mx-auto mb-4 text-green-600" size={64} />
          <h2 className="text-xl font-semibold mb-4">You're All Set!</h2>
          <p className="text-gray-600 mb-6">
            Start accessing your earned wages instantly, whenever you need them.
          </p>
          
          <button
            onClick={handleNext}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
          >
            Access My Earnings
          </button>
        </div>
      );

    default:
      return null;
  }
}