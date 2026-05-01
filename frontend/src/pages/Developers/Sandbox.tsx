import React, { useState } from 'react';
import { Play, RefreshCw, Database, Users, CreditCard, Target } from 'lucide-react';
import api from '../../services/api';

interface SandboxData {
  users: Array<{
    id: string;
    email: string;
    name: string;
    balance: number;
    currency: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    currency: string;
  }>;
  payments: Array<{
    id: string;
    from: string;
    to: string;
    amount: number;
    currency: string;
    status: string;
  }>;
}

const initialSandboxData: SandboxData = {
  users: [
    { id: 'user_1', email: 'alice@example.com', name: 'Alice Johnson', balance: 1250.00, currency: 'USDC' },
    { id: 'user_2', email: 'bob@example.com', name: 'Bob Smith', balance: 850.50, currency: 'USDC' },
    { id: 'user_3', email: 'carol@example.com', name: 'Carol Davis', balance: 2100.75, currency: 'USDC' }
  ],
  goals: [
    { id: 'goal_1', title: 'Team Lunch Fund', target: 500.00, current: 325.00, currency: 'USDC' },
    { id: 'goal_2', title: 'Office Equipment', target: 2000.00, current: 1450.00, currency: 'USDC' }
  ],
  payments: [
    { id: 'pay_1', from: 'Alice Johnson', to: 'Bob Smith', amount: 50.00, currency: 'USDC', status: 'completed' },
    { id: 'pay_2', from: 'Carol Davis', to: 'Team Lunch Fund', amount: 25.00, currency: 'USDC', status: 'completed' }
  ]
};

const testScenarios = [
  {
    id: 'split_payment',
    name: 'Group Payment (Simulated)',
    description: 'Simulate a grouped transfer distribution',
    endpoint: 'POST /api/social/group-payment',
    payload: {
      amount: 100.00,
      currency: 'USDC',
      recipients: [
        { wallet_id: 'user_1', percentage: 60 },
        { wallet_id: 'user_2', percentage: 40 }
      ]
    }
  },
  {
    id: 'create_goal',
    name: 'Create Goal',
    description: 'Create a new crowdfunding goal',
    endpoint: 'POST /api/social/goals',
    payload: {
      title: 'New Project Fund',
      description: 'Funding for our next big project',
      target_amount: 1000.00,
      currency: 'USDC'
    }
  },
  {
    id: 'contribute_goal',
    name: 'Contribute to Goal',
    description: 'Make a contribution to an existing goal',
    endpoint: 'POST /api/social/goals/contribute',
    payload: {
      contributor_name: 'Test User',
      amount: 50.00,
      currency: 'USDC'
    }
  },
  {
    id: 'ewa_list',
    name: 'List EWA Requests',
    description: 'Read account EWA requests for dashboard integration',
    endpoint: 'GET /api/account/ewa/requests',
    payload: {
      note: 'No body required'
    }
  }
];

export default function Sandbox() {
  const [sandboxData, setSandboxData] = useState<SandboxData>(initialSandboxData);
  const [selectedScenario, setSelectedScenario] = useState(testScenarios[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const resetSandbox = () => {
    setSandboxData(initialSandboxData);
    setResults(null);
  };

  const runScenario = async () => {
    setIsRunning(true);
    try {
      let mockResponse: any;
      switch (selectedScenario.id) {
        case 'split_payment':
          // Simulated: useful for UI/logic walkthroughs.
          await new Promise(resolve => setTimeout(resolve, 1200));
          mockResponse = {
            id: 'split_' + Date.now(),
            status: 'completed',
            total_amount: 100.00,
            recipients: [
              { wallet_id: 'user_1', amount: 60.00, status: 'completed' },
              { wallet_id: 'user_2', amount: 40.00, status: 'completed' }
            ]
          };
          // Update sandbox data
          setSandboxData(prev => ({
            ...prev,
            users: prev.users.map(user => {
              if (user.id === 'user_1') return { ...user, balance: user.balance + 60 };
              if (user.id === 'user_2') return { ...user, balance: user.balance + 40 };
              return user;
            }),
            payments: [...prev.payments, {
              id: mockResponse.id,
              from: 'Split Payment',
              to: 'Multiple Recipients',
              amount: 100.00,
              currency: 'USDC',
              status: 'completed'
            }]
          }));
          break;

        case 'create_goal':
          mockResponse = (await api.post('/social/goals', selectedScenario.payload)).data;
          setSandboxData(prev => ({
            ...prev,
            goals: [...prev.goals, {
              id: mockResponse.id,
              title: mockResponse.title || 'Created Goal',
              target: Number(mockResponse.target_amount || 0),
              current: Number(mockResponse.current_amount || 0),
              currency: mockResponse.currency || 'USDC'
            }]
          }));
          break;

        case 'contribute_goal': {
          const goalsResponse = await api.get('/social/goals');
          const goals = goalsResponse.data || [];
          const goal = goals[0];
          if (!goal?.id) {
            throw new Error('No goal found. Create a goal first.');
          }
          mockResponse = (await api.post('/social/goals/contribute', {
            goal_id: goal.id,
            contributor_name: 'Sandbox User',
            amount: 50,
            currency: goal.currency || 'USDC',
          })).data;
          break;
        }

        case 'ewa_list':
          mockResponse = (await api.get('/account/ewa/requests')).data;
          break;

        default:
          mockResponse = { success: true, message: 'Test completed successfully' };
      }

      setResults(mockResponse);
    } catch (err: any) {
      setResults({
        error: err?.response?.data || err?.message || 'Request failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sandbox Environment</h1>
            <p className="text-gray-600">
              Test Corridor APIs with sample data. Run scenarios, view responses, and see how data changes in real-time.
            </p>
          </div>
          <button
            onClick={resetSandbox}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Sandbox</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Test Scenarios */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Test Scenarios</h2>
          
          {testScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedScenario.id === scenario.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <h3 className="font-medium text-gray-900 mb-1">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
              <code className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {scenario.endpoint}
              </code>
            </div>
          ))}

          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Request Payload</h3>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
              <code>{JSON.stringify(selectedScenario.payload, null, 2)}</code>
            </pre>
            
            <button
              onClick={runScenario}
              disabled={isRunning}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Running...' : 'Run Test'}</span>
            </button>
          </div>

          {results && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Response</h3>
              <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                <code>{JSON.stringify(results, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Sandbox Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
            </div>
            
            <div className="space-y-3">
              {sandboxData.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{user.balance.toFixed(2)} {user.currency}</div>
                    <div className="text-xs text-gray-500">{user.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
            </div>
            
            <div className="space-y-3">
              {sandboxData.goals.map((goal) => (
                <div key={goal.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{goal.title}</div>
                    <div className="text-sm text-gray-600">
                      {goal.current.toFixed(2)} / {goal.target.toFixed(2)} {goal.currency}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(goal.current / goal.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{goal.id}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            </div>
            
            <div className="space-y-3">
              {sandboxData.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-gray-900">{payment.from} → {payment.to}</div>
                    <div className="text-xs text-gray-500">{payment.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{payment.amount.toFixed(2)} {payment.currency}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
