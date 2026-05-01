import React from 'react'
import { ArrowRight, Clock, Heart, TrendingUp, Shield, Users, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'

const EWAForBusiness = () => {
  const navigate = useNavigate()

  const benefits = [
    {
      icon: TrendingUp,
      title: "Improve Retention",
      stat: "40%",
      description: "Reduce employee turnover with financial wellness benefits"
    },
    {
      icon: Heart,
      title: "Reduce Stress",
      stat: "60%",
      description: "Lower financial stress leads to happier, more productive employees"
    },
    {
      icon: Clock,
      title: "Instant Access",
      stat: "24/7",
      description: "Employees can access earned wages anytime, anywhere"
    },
    {
      icon: Shield,
      title: "Zero Risk",
      stat: "0%",
      description: "No cost to employers, no impact on cash flow"
    }
  ]

  const industries = [
    {
      name: "Retail",
      description: "High turnover industry benefits most from EWA programs",
      stats: "45% reduction in turnover, 30% faster hiring"
    },
    {
      name: "Healthcare",
      description: "Support essential workers with flexible wage access",
      stats: "85% employee satisfaction, 25% less absenteeism"
    },
    {
      name: "Hospitality",
      description: "Seasonal workers appreciate immediate wage access",
      stats: "50% improvement in retention during peak seasons"
    },
    {
      name: "Manufacturing",
      description: "Shift workers benefit from flexible payment schedules",
      stats: "35% reduction in payroll advances, 20% less overtime"
    }
  ]

  const features = [
    "Instant wage access up to 50% of earned wages",
    "No interest, fees, or credit checks",
    "Seamless payroll integration",
    "Real-time earnings tracking",
    "Financial wellness education",
    "Mobile-first experience",
    "Compliance and security built-in",
    "Detailed analytics and reporting"
  ]

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Earned Wage Access for Business - Employee Financial Wellness | Corridor"
        description="Boost employee retention and satisfaction with Corridor's EWA solution. Zero cost to employers, instant wage access for employees."
        keywords="earned wage access, EWA, employee benefits, financial wellness, payroll, employee retention"
      />

      {/* Hero */}
      <section className="py-20 px-6 pt-32 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-600 text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            <span>Earned Wage Access</span>
          </div>
          
          <h1 className="text-6xl font-black text-slate-900 mb-8">
            Transform Employee
            <span className="block text-green-600">Financial Wellness</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Offer your employees instant access to their earned wages. Reduce turnover, improve satisfaction, 
            and support financial wellness with zero cost to your business.
          </p>
          
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Schedule Demo
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Why Businesses Choose EWA
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-green-200 transition-all hover:shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mx-auto mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                
                <div className="text-3xl font-black text-slate-900 mb-2">{benefit.stat}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Perfect for Every Industry
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {industries.map((industry) => (
              <div key={industry.name} className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-green-200 transition-all">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{industry.name}</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">{industry.description}</p>
                <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
                  {industry.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Complete EWA Solution
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Simple Implementation
          </h2>
          
          <div className="space-y-8">
            {[
              { step: 1, title: "Integration Setup", description: "Connect your payroll system with our secure API integration", time: "1 day" },
              { step: 2, title: "Employee Onboarding", description: "Employees download the app and verify their identity", time: "5 minutes" },
              { step: 3, title: "Go Live", description: "Employees can immediately access their earned wages", time: "Instant" },
              { step: 4, title: "Ongoing Support", description: "24/7 support and detailed analytics for HR teams", time: "Always" }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6 p-6 bg-white rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-green-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-8">
            Calculate Your ROI
          </h2>
          <p className="text-xl text-slate-600 mb-12">
            See how much you could save with reduced turnover and improved productivity
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <div className="text-2xl font-black text-green-600 mb-2">$3,500</div>
              <div className="text-sm text-green-700 font-medium">Average cost to replace one employee</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-2xl font-black text-blue-600 mb-2">40%</div>
              <div className="text-sm text-blue-700 font-medium">Reduction in turnover with EWA</div>
            </div>
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-2xl font-black text-purple-600 mb-2">$0</div>
              <div className="text-sm text-purple-700 font-medium">Cost to your business</div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Get Custom ROI Analysis
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Support Your Employees?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join hundreds of companies already offering EWA benefits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-white text-green-600 rounded-2xl font-bold hover:bg-green-50 transition-all shadow-lg flex items-center gap-2 justify-center"
            >
              Schedule Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 bg-green-700 text-white rounded-2xl font-bold hover:bg-green-800 transition-all flex items-center gap-2 justify-center"
            >
              View Documentation
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default EWAForBusiness