import React from 'react';
import { MapPin, Clock, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkHereContentProps {
    data: any;
}

export const WorkHereContent: React.FC<WorkHereContentProps> = ({ data }) => {
    const navigate = useNavigate();

    return (
        <div className="p-8 overflow-y-auto">
            {/* Hero */}
            <div className="text-center mb-12">
                <div className="text-6xl mb-4">{data.hero.emoji}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{data.hero.title}</h2>
                <p className="text-lg text-gray-600">{data.hero.subtitle}</p>
            </div>

            {/* Culture */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{data.culture.title}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {data.culture.values.map((value: any, index: number) => (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6"
                        >
                            <div className="text-4xl mb-3">{value.emoji}</div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h4>
                            <p className="text-sm text-gray-700">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Open Positions */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h3>
                <div className="space-y-4">
                    {data.openings.map((job: any, index: number) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900">{job.title}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {job.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {job.type}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    onClick={() => navigate('/careers')}
                                >
                                    View role & apply
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{job.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill: string, skillIndex: number) => (
                                    <span
                                        key={skillIndex}
                                        className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Perks */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Perks & Benefits</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {data.perks.map((perk: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-gray-700">
                            <span className="text-lg">{perk.split(' ')[0]}</span>
                            <span className="text-sm">{perk.substring(perk.indexOf(' ') + 1)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
