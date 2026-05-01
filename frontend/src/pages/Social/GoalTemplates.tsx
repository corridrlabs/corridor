import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Users, Heart, Briefcase, GraduationCap, Home, Car, Plane, ArrowRight } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  suggestedAmount: number;
  currency: string;
  tips: string[];
  examples: string[];
}

const GoalTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const templates: Template[] = [
    {
      id: 'birthday',
      name: 'Birthday Gift Fund',
      description: 'Collect money from friends and family for a special birthday gift',
      icon: <Gift className="h-8 w-8" />,
      category: 'celebrations',
      suggestedAmount: 200,
      currency: 'USD',
      tips: [
        'Set a realistic target based on your group size',
        'Share photos of potential gifts to inspire contributors',
        'Set a deadline before the birthday'
      ],
      examples: ['50th Birthday Surprise', 'Sweet 16 Gift Collection', 'Milestone Birthday Fund']
    },
    {
      id: 'group_gift',
      name: 'Group Gift Collection',
      description: 'Pool money together for weddings, baby showers, or farewell gifts',
      icon: <Users className="h-8 w-8" />,
      category: 'celebrations',
      suggestedAmount: 300,
      currency: 'USD',
      tips: [
        'Include a photo of the recipient',
        'Explain the occasion clearly',
        'Set contribution suggestions for different budgets'
      ],
      examples: ['Wedding Gift for Sarah & John', 'Baby Shower for Emma', 'Farewell Gift for Mike']
    },
    {
      id: 'emergency',
      name: 'Emergency Fund',
      description: 'Raise funds quickly for medical bills, disasters, or urgent needs',
      icon: <Heart className="h-8 w-8" />,
      category: 'support',
      suggestedAmount: 1000,
      currency: 'USD',
      tips: [
        'Be transparent about the situation',
        'Provide regular updates on progress',
        'Share how the funds will be used'
      ],
      examples: ['Medical Emergency Fund', 'Family Crisis Support', 'Disaster Relief Fund']
    },
    {
      id: 'business',
      name: 'Business Startup',
      description: 'Crowdfund your business idea or startup venture',
      icon: <Briefcase className="h-8 w-8" />,
      category: 'business',
      suggestedAmount: 5000,
      currency: 'USD',
      tips: [
        'Create a detailed business plan',
        'Offer rewards or equity to contributors',
        'Show your prototype or MVP'
      ],
      examples: ['Tech Startup Launch', 'Local Bakery Opening', 'App Development Fund']
    },
    {
      id: 'education',
      name: 'Education Fund',
      description: 'Raise money for tuition, courses, or educational expenses',
      icon: <GraduationCap className="h-8 w-8" />,
      category: 'education',
      suggestedAmount: 2000,
      currency: 'USD',
      tips: [
        'Explain your educational goals',
        'Share your academic achievements',
        'Describe how education will impact your future'
      ],
      examples: ['College Tuition Fund', 'Coding Bootcamp', 'Study Abroad Program']
    },
    {
      id: 'travel',
      name: 'Travel Fund',
      description: 'Collect money for group trips, honeymoons, or travel adventures',
      icon: <Plane className="h-8 w-8" />,
      category: 'travel',
      suggestedAmount: 1500,
      currency: 'USD',
      tips: [
        'Share your travel itinerary',
        'Post photos of your destination',
        'Explain why this trip is meaningful'
      ],
      examples: ['Honeymoon in Bali', 'Group Trip to Europe', 'Volunteer Trip to Kenya']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'celebrations', name: 'Celebrations' },
    { id: 'support', name: 'Support' },
    { id: 'business', name: 'Business' },
    { id: 'education', name: 'Education' },
    { id: 'travel', name: 'Travel' }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const useTemplate = (template: Template) => {
    // Navigate to create goal with template pre-filled
    navigate('/social/goals/create', { 
      state: { 
        template: {
          title: template.name,
          description: template.description,
          amount: template.suggestedAmount,
          currency: template.currency,
          template_id: template.id
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal Templates</h1>
        <p className="text-gray-600">Choose from pre-built templates to create your goal faster</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{template.name}</h3>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {template.category}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {template.description}
              </p>

              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Suggested target:</div>
                <div className="text-lg font-bold text-gray-900">
                  {template.suggestedAmount} {template.currency}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Examples:</div>
                <div className="space-y-1">
                  {template.examples.slice(0, 2).map((example, index) => (
                    <div key={index} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {example}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => useTemplate(template)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Use Template
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Tips for success:</div>
              <ul className="space-y-1">
                {template.tips.slice(0, 2).map((tip, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No templates found in this category</p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-blue-600 hover:text-blue-700 mt-2"
          >
            View all templates
          </button>
        </div>
      )}

      <div className="mt-12 bg-blue-50 rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Need a custom goal?</h2>
        <p className="text-gray-600 mb-4">
          Can't find the right template? Create a completely custom goal from scratch.
        </p>
        <button
          onClick={() => navigate('/social/goals/create')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create Custom Goal
        </button>
      </div>
    </div>
  );
};

export default GoalTemplates;