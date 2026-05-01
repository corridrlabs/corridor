import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className={`max-w-2xl w-full rounded-2xl shadow-xl p-8 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to Corridor</h1>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Your all-in-one business orchestration platform</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-sm">💰</span>
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Financial Operations</h3>
              <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Payroll, invoicing, and treasury management in one place</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm">👥</span>
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Human Capital</h3>
              <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Employee management and Earned Wage Access</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-sm">🤖</span>
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Automation</h3>
              <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Intelligent workflows and business process automation</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/onboarding/use-case')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Welcome;
