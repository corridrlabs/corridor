import React from 'react'
import { Users, Zap, Network, Brain, Shield, Globe } from 'lucide-react'

const Features = () => {
  const pillars = [
    {
      icon: Users,
      title: "Social Payments",
      description: "Group contributions, bill splitting, and crowdfunding made simple",
      features: ["Group Goals", "Split Bills", "Shared Wallets", "Social Feed"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Earned Wage Access",
      description: "On-demand wage access that boosts employee financial wellness",
      features: ["Instant Access", "No Interest", "Payroll Integration", "Financial Health"],
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Network,
      title: "Payment Infrastructure",
      description: "Multi-rail payment orchestration with global reach",
      features: ["50+ Rails", "Auto-routing", "Real-time Settlement", "Compliance"],
      color: "from-emerald-500 to-teal-500"
    }
  ]

  const additionalFeatures = [
    {
      icon: Brain,
      title: "AI Automation",
      description: "Intelligent workflows that learn and adapt to your business patterns"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with SOC 2 compliance and end-to-end encryption"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Multi-jurisdiction support with local payment methods worldwide"
    }
  ]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Three Core Pillars
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Corridor unifies social payments, employee benefits, and payment infrastructure into one powerful platform
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pillars.map((pillar, index) => (
            <div key={pillar.title} className="group">
              <div className="relative p-8 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${pillar.color} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500`} />
                
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pillar.color} flex items-center justify-center mb-6`}>
                    <pillar.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{pillar.title}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">{pillar.description}</p>
                  
                  <div className="space-y-2">
                    {pillar.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {additionalFeatures.map((feature) => (
            <div key={feature.title} className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features