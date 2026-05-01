import React from 'react';
import { Check } from 'lucide-react';

interface PricingContentProps {
    data: any;
}

export const PricingContent: React.FC<PricingContentProps> = ({ data }) => {
    return (
        <div className="p-8">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple, transparent pricing</h2>
                <p className="text-sm text-gray-600">Choose the plan that's right for your business</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {data.plans.map((plan: any, index: number) => (
                    <div
                        key={index}
                        className={`bg-white rounded-lg border-2 p-6 ${plan.popular
                                ? 'border-blue-500 shadow-xl relative'
                                : 'border-gray-200'
                            }`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    MOST POPULAR
                                </span>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                {plan.period && <span className="text-sm text-gray-600">{plan.period}</span>}
                            </div>
                            <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>

                        <ul className="space-y-3 mb-6">
                            {plan.features.map((feature: string, featureIndex: number) => (
                                <li key={featureIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${plan.popular
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            {plan.cta}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
