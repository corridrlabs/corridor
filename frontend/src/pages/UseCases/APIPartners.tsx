import React from 'react'
import { ArrowRight, Code, Layers, Zap, Shield, Globe, Puzzle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'
import { API_BASE_URL, APP_BASE_URL } from '../../config/env'

const APIPartners = () => {
  const navigate = useNavigate()
  const docsApiBase = API_BASE_URL || APP_BASE_URL || 'YOUR_API_BASE_URL'

  const partnerTypes = [
    {
      icon: Code,
      title: "API Integration",
      description: "Embed Corridor's payment infrastructure directly into your platform",
      benefits: ["White-label solutions", "Custom branding", "Revenue sharing", "Technical support"]
    },
    {
      icon: Layers,
      title: "Platform Partners",
      description: "Build complementary services on top of Corridor's infrastructure",
      benefits: ["Marketplace listing", "Co-marketing", "Joint solutions", "Priority support"]
    },
    {
      icon: Puzzle,
      title: "System Integrators",
      description: "Help enterprises implement and customize Corridor solutions",
      benefits: ["Certification program", "Training resources", "Lead sharing", "Implementation support"]
    }
  ]

  const apiFeatures = [
    {
      title: "Payment Processing",
      description: "Accept payments across 50+ rails with intelligent routing",
      endpoint: "POST /api/payment-links"
    },
    {
      title: "Social Goals",
      description: "Create and manage group funding campaigns",
      endpoint: "POST /api/social/goals"
    },
    {
      title: "EWA Services",
      description: "Offer earned wage access to your users",
      endpoint: "GET /api/ewa/settings"
    },
    {
      title: "Wallet Management",
      description: "Multi-currency wallet operations and balances",
      endpoint: "GET /api/wallets"
    },
    {
      title: "Compliance Tools",
      description: "KYC, AML, and regulatory compliance automation",
      endpoint: "GET /api/account/status"
    },
    {
      title: "Analytics & Reporting",
      description: "Real-time transaction and user analytics",
      endpoint: "GET /api/account/liquidity"
    }
  ]

  const useCases = [
    {
      title: "Fintech Platforms",
      description: "Add payment infrastructure to your financial services",
      example: "Neo-bank adds multi-rail payments and social features"
    },
    {
      title: "HR Software",
      description: "Integrate EWA and payroll services into your HR platform",
      example: "HRIS platform offers instant wage access to employees"
    },
    {
      title: "E-commerce",
      description: "Enable group buying and social commerce features",
      example: "Marketplace adds group purchasing and bill splitting"
    },
    {
      title: "Enterprise Software",
      description: "Embed payment workflows into business applications",
      example: "ERP system integrates automated vendor payments"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="API Partners - Build on Corridor Platform | Corridor"
        description="Partner with Corridor to build innovative financial solutions. White-label APIs, revenue sharing, and comprehensive developer tools."
        keywords="API partnership, fintech API, payment API, white-label, developer platform, financial infrastructure"
      />

      {/* Hero */}
      <section className="py-20 px-6 pt-32 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-600 text-sm font-medium mb-8">
            <Code className="w-4 h-4" />
            <span>API Partners</span>
          </div>
          
          <h1 className="text-6xl font-black text-slate-900 mb-8">
            Build the Future of
            <span className="block text-purple-600">Financial Services</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Partner with Corridor to create innovative financial solutions. Access our comprehensive APIs, 
            white-label options, and revenue-sharing opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 justify-center"
            >
              View API Docs
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition-all flex items-center gap-2 justify-center"
            >
              Become a Partner
            </button>
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Partnership Opportunities
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((type) => (
              <div key={type.title} className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-purple-200 transition-all hover:shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
                  <type.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{type.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{type.description}</p>
                
                <ul className="space-y-2">
                  {type.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-sm text-slate-600 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Comprehensive API Suite
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apiFeatures.map((feature) => (
              <div key={feature.title} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-purple-200 transition-all">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{feature.description}</p>
                <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  {feature.endpoint}
                </code>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
            >
              Explore Full API Documentation
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Partner Success Stories
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={useCase.title} className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-purple-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                    <p className="text-slate-600 mb-4 leading-relaxed">{useCase.description}</p>
                    <div className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block">
                      {useCase.example}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Developer-First Experience
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-slate-900">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-slate-900">Global Infrastructure</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <span className="font-bold text-slate-900">99.9% Uptime SLA</span>
              </div>
            </div>
            
            <div className="p-6 bg-slate-900 rounded-2xl text-green-400 font-mono text-sm">
              <div className="text-slate-400 mb-2">// Quick start example</div>
              <div>curl -X POST \</div>
              <div className="ml-4">{`${docsApiBase}/api/payment-links`} \</div>
              <div className="ml-4">-H "Authorization: Bearer $API_KEY" \</div>
              <div className="ml-4">-d '{`{`}</div>
              <div className="ml-8">"amount": 1000,</div>
              <div className="ml-8">"currency": "USD",</div>
              <div className="ml-8">"recipient": "user@example.com"</div>
              <div className="ml-4">{`}`}'</div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-16">
            Partner Benefits
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-2xl font-black text-purple-600 mb-2">Revenue Share</div>
              <div className="text-sm text-purple-700 font-medium">Earn up to 30% on transactions</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-2xl font-black text-blue-600 mb-2">24/7 Support</div>
              <div className="text-sm text-blue-700 font-medium">Dedicated technical support</div>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <div className="text-2xl font-black text-green-600 mb-2">Co-Marketing</div>
              <div className="text-sm text-green-700 font-medium">Joint marketing opportunities</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Build Together?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join our partner ecosystem and create the next generation of financial services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold hover:bg-purple-50 transition-all shadow-lg flex items-center gap-2 justify-center"
            >
              Apply for Partnership
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 bg-purple-700 text-white rounded-2xl font-bold hover:bg-purple-800 transition-all flex items-center gap-2 justify-center"
            >
              Start with API Docs
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default APIPartners
