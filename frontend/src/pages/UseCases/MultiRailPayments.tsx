import React from 'react'
import { ArrowRight, Globe, Zap, Shield, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'

const MultiRailPayments = () => {
  const navigate = useNavigate()

  const paymentRails = [
    {
      category: "Traditional Banking",
      rails: ["SWIFT", "ACH", "Wire Transfers", "SEPA"],
      regions: ["Global", "US", "Europe"],
      speed: "1-3 days",
      cost: "High"
    },
    {
      category: "Mobile Money",
      rails: ["M-Pesa", "MTN Mobile Money", "Airtel Money", "Orange Money"],
      regions: ["Africa", "Asia"],
      speed: "Instant",
      cost: "Low"
    },
    {
      category: "Digital Wallets",
      rails: ["PayPal", "Paystack", "Flutterwave", "M-Pesa"],
      regions: ["Global", "Africa"],
      speed: "Instant",
      cost: "Medium"
    },
    {
      category: "Cryptocurrency",
      rails: ["USDC", "Bitcoin", "Ethereum", "Solana"],
      regions: ["Global"],
      speed: "Minutes",
      cost: "Very Low"
    },
    {
      category: "Card Networks",
      rails: ["Visa", "Mastercard", "American Express", "Local Cards"],
      regions: ["Global"],
      speed: "Instant",
      cost: "Medium"
    }
  ]

  const benefits = [
    {
      icon: Globe,
      title: "Global Reach",
      description: "Send and receive payments in 150+ countries with local payment methods",
      stat: "150+ Countries"
    },
    {
      icon: Zap,
      title: "Intelligent Routing",
      description: "AI-powered routing selects the best rail based on cost, speed, and success rate",
      stat: "99.9% Success Rate"
    },
    {
      icon: Shield,
      title: "Compliance Built-in",
      description: "Automatic compliance with local regulations and anti-money laundering rules",
      stat: "100% Compliant"
    },
    {
      icon: TrendingUp,
      title: "Cost Optimization",
      description: "Reduce payment costs by up to 60% with intelligent rail selection",
      stat: "60% Cost Savings"
    }
  ]

  const useCases = [
    {
      title: "Cross-Border Payroll",
      description: "Pay employees globally with automatic currency conversion and local settlement",
      example: "Tech company pays 500 employees across 20 countries in minutes",
      savings: "Save 45% on international transfer fees"
    },
    {
      title: "Supplier Payments",
      description: "Automate vendor payments with smart routing and approval workflows",
      example: "Manufacturing company automates payments to 200+ suppliers",
      savings: "Reduce processing time by 80%"
    },
    {
      title: "Marketplace Payouts",
      description: "Instant payouts to sellers and service providers worldwide",
      example: "E-commerce platform pays sellers in 50+ countries instantly",
      savings: "Improve seller satisfaction by 90%"
    },
    {
      title: "Remittances",
      description: "Low-cost money transfers with competitive exchange rates",
      example: "Fintech app enables $10M+ in monthly remittances",
      savings: "70% lower fees than traditional services"
    }
  ]

  const features = [
    "50+ payment rails integrated",
    "Real-time currency conversion",
    "Intelligent routing and fallbacks",
    "Compliance automation",
    "Multi-currency wallets",
    "Batch payment processing",
    "Real-time tracking and notifications",
    "Detailed analytics and reporting"
  ]

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Multi-Rail Payments - Global Payment Infrastructure | Corridor"
        description="Send and receive payments globally with Corridor's multi-rail infrastructure. 50+ payment methods, intelligent routing, and compliance automation."
        keywords="multi-rail payments, global payments, payment infrastructure, cross-border payments, payment routing"
      />

      {/* Hero */}
      <section className="py-20 px-6 pt-32 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-8">
            <Globe className="w-4 h-4" />
            <span>Multi-Rail Payments</span>
          </div>
          
          <h1 className="text-6xl font-black text-slate-900 mb-8">
            Global Payments
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Connect to 50+ payment rails worldwide with intelligent routing, automatic compliance, 
            and real-time settlement. One API for all your global payment needs.
          </p>
          
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Start Sending Globally
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Payment Rails */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            50+ Payment Rails, One Platform
          </h2>
          
          <div className="space-y-6">
            {paymentRails.map((rail) => (
              <div key={rail.category} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all">
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{rail.category}</h3>
                    <div className="flex flex-wrap gap-1">
                      {rail.rails.map((r) => (
                        <span key={r} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Regions</div>
                    <div className="text-sm font-medium text-slate-700">
                      {rail.regions.join(", ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Speed</div>
                    <div className="text-sm font-medium text-slate-700">{rail.speed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Cost</div>
                    <div className={`text-sm font-medium ${
                      rail.cost === 'Very Low' ? 'text-green-600' :
                      rail.cost === 'Low' ? 'text-green-500' :
                      rail.cost === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {rail.cost}
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Learn More →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Why Choose Multi-Rail Payments
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                
                <div className="text-2xl font-black text-slate-900 mb-2">{benefit.stat}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Real-World Applications
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={useCase.title} className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                    <p className="text-slate-600 mb-4 leading-relaxed">{useCase.description}</p>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                        {useCase.example}
                      </div>
                      <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                        {useCase.savings}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Complete Payment Infrastructure
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            How It Works
          </h2>
          
          <div className="space-y-8">
            {[
              { step: 1, title: "Submit Payment", description: "Send payment request with recipient details and amount", icon: DollarSign },
              { step: 2, title: "Intelligent Routing", description: "AI selects optimal rail based on cost, speed, and success rate", icon: Zap },
              { step: 3, title: "Compliance Check", description: "Automatic KYC/AML verification and regulatory compliance", icon: Shield },
              { step: 4, title: "Real-time Settlement", description: "Payment processed and settled with real-time tracking", icon: Clock }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-8">
            Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-12">
            Pay only for what you use with competitive rates across all payment rails
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-white rounded-2xl border border-slate-200">
              <div className="text-2xl font-black text-slate-900 mb-2">0.5-2.9%</div>
              <div className="text-sm text-slate-600 font-medium">Transaction fees</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-2xl font-black text-blue-600 mb-2">$0</div>
              <div className="text-sm text-blue-700 font-medium">Setup or monthly fees</div>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <div className="text-2xl font-black text-green-600 mb-2">Real-time</div>
              <div className="text-sm text-green-700 font-medium">Rate optimization</div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/pricing')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            View Detailed Pricing
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Go Global?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start sending payments worldwide with our multi-rail infrastructure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 justify-center"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-blue-700 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all flex items-center gap-2 justify-center"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default MultiRailPayments
