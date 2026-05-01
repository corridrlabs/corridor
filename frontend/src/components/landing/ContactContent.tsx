import React from 'react';
import { Mail, Calendar, MessageSquare, Phone } from 'lucide-react';

interface ContactContentProps {
    data: any;
}

const iconMap: Record<string, any> = {
    Mail, Calendar, MessageSquare, Phone
};

export const ContactContent: React.FC<ContactContentProps> = ({ data }) => {
    return (
        <div className="p-8">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.title}</h2>
                <p className="text-sm text-gray-600">{data.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {data.options.map((option: any, index: number) => {
                    const Icon = iconMap[option.icon];
                    return (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{option.title}</h3>
                            <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                                {option.action} →
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
