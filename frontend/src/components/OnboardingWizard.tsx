import React, { useState } from 'react';
import { Check, ChevronRight, Building, CreditCard, Users, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
    id: string;
    title: string;
    description: string;
    icon: any;
}

const steps: Step[] = [
    { id: 'profile', title: 'Business Profile', description: 'Set up your company details', icon: Building },
    { id: 'payment', title: 'Payment Methods', description: 'Connect Stripe or M-Pesa', icon: CreditCard },
    { id: 'team', title: 'Team Members', description: 'Invite your colleagues', icon: Users },
    { id: 'complete', title: 'Complete', description: 'Ready to go!', icon: CheckCircle },
];

export const OnboardingWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCompleted(true);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-12 min-h-[500px]">
                {/* Sidebar */}
                <div className="col-span-4 bg-gray-50 p-8 border-r border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Setup Guide</h2>
                    <p className="text-sm text-gray-500 mb-8">Complete these steps to get your business ready.</p>

                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={clsx(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                        index < currentStep ? "bg-green-500 text-white" :
                                            index === currentStep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                                    )}>
                                        {index < currentStep ? <Check size={16} /> : index + 1}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={clsx(
                                            "w-0.5 h-full mt-2",
                                            index < currentStep ? "bg-green-500" : "bg-gray-200"
                                        )} />
                                    )}
                                </div>
                                <div className={clsx("pb-8", index === currentStep ? "opacity-100" : "opacity-60")}>
                                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-8 p-12 flex flex-col">
                    <div className="flex-1">
                        <div className="mb-8">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                                {React.createElement(steps[currentStep].icon, { size: 24 })}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
                            <p className="text-gray-500 mt-2">
                                {currentStep === 0 && "Let's start with the basics. Tell us about your company."}
                                {currentStep === 1 && "Connect your preferred payment providers to start accepting payments."}
                                {currentStep === 2 && "Add your team members to collaborate on Corridor."}
                                {currentStep === 3 && "You're all set! Welcome to Corridor."}
                            </p>
                        </div>

                        {/* Placeholder Content for Steps */}
                        <div className="space-y-4">
                            {currentStep === 0 && (
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                        <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Acme Inc." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                            <option>Technology</option>
                                            <option>Retail</option>
                                            <option>Finance</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {/* Other steps would go here */}
                        </div>
                    </div>

                    <div className="flex justify-end pt-8 border-t border-gray-100">
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
