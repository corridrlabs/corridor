import React, { useState } from 'react'
import { Play, Code, Smartphone, Monitor, ArrowRight } from 'lucide-react'

const FeatureShowcase = () => {
  const [activeDemo, setActiveDemo] = useState('social-payments')

  const demos = {
    'social-payments': {
      title: 'Social Payments in Action',
      description: 'See how groups can create goals, contribute, and track progress in real-time',
      videoPlaceholder: '🎥 Social Payments Demo',
      codeExample: `// Create a group goal
const goal = await corridor.goals.create({
  title: "Team Retreat Fund",
  target: 5000,
  currency: "USD",
  deadline: "2024-06-01",
  contributors: ["team@company.com"]
});

// Add contribution
await corridor.goals.contribute(goal.id, {
  amount: 100,
  contributor: "john@company.com",
  message: "Can't wait for the retreat!"
});`
    },
    'ewa': {
      title: 'Earned Wage Access Flow',
      description: 'Watch how employees can access their earned wages instantly',
      videoPlaceholder: '🎥 EWA Demo',
      codeExample: `// Check available earnings
const earnings = await corridor.ewa.getAvailable(employeeId);

// Request advance
const advance = await corridor.ewa.requestAdvance({
  employeeId: "emp_123",
  amount: 200,
  reason: "Emergency expense"
});

// Process advance
await corridor.ewa.processAdvance(advance.id);`
    },
    'multi-rail': {
      title: 'Multi-Rail Payment Routing',
      description: 'See intelligent payment routing across different rails',
      videoPlaceholder: '🎥 Multi-Rail Demo',
      codeExample: `// Send payment with intelligent routing
const payment = await corridor.payments.send({
  amount: 1000,
  currency: "USD",
  recipient: {
    email: "vendor@supplier.com",
    country: "KE"
  },
  routing: "auto", // AI selects best rail
  fallbacks: ["mobile_money", "bank_transfer"]
});

// Track payment status
const status = await corridor.payments.track(payment.id);`
    }
  }

  const features = [
    {
      id: 'social-payments',
      title: 'Social Payments',
      icon: '👥',
      description: 'Group funding made simple'
    },
    {
      id: 'ewa',
      title: 'Earned Wage Access',
      icon: '⚡',
      description: 'Instant wage access for employees'
    },
    {
      id: 'multi-rail',
      title: 'Multi-Rail Payments',
      icon: '🌍',
      description: 'Global payment infrastructure'
    }
  ]

  const currentDemo = demos[activeDemo as keyof typeof demos]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            See Corridor in Action
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Interactive demos and code examples showing how Corridor transforms business operations
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveDemo(feature.id)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 ${
                activeDemo === feature.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="text-lg">{feature.icon}</span>
              <div className="text-left">
                <div className="font-bold">{feature.title}</div>
                <div className="text-xs opacity-75">{feature.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Video/Demo Area */}
          <div className="space-y-6">
            <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <div className="text-2xl font-bold mb-2">{currentDemo.videoPlaceholder}</div>
                <div className="text-sm text-white/80">Click to play interactive demo</div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{currentDemo.title}</h3>
              <p className="text-slate-600 leading-relaxed">{currentDemo.description}</p>
            </div>
          </div>

          {/* Code Example */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-green-400 font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-4 h-4" />
                <span className="text-slate-400">API Example</span>
              </div>
              <pre className="whitespace-pre-wrap">{currentDemo.codeExample}</pre>
            </div>

            {/* Platform Support */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                <Monitor className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-700">Web Dashboard</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                <Smartphone className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-700">Mobile App</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                <Code className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-slate-700">REST API</div>
              </div>
            </div>

            <button className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              Try This Feature
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Play className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Video Tutorials</h4>
            <p className="text-slate-600 text-sm mb-4">Step-by-step guides for every feature</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Watch Now →
            </button>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mx-auto mb-4">
              <Code className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">API Documentation</h4>
            <p className="text-slate-600 text-sm mb-4">Complete reference with examples</p>
            <button className="text-green-600 hover:text-green-700 font-medium text-sm">
              Explore Docs →
            </button>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mx-auto mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Live Demo</h4>
            <p className="text-slate-600 text-sm mb-4">Book a personalized walkthrough</p>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              Schedule Demo →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeatureShowcase