import React from 'react'
import { ArrowRight, Users, Target, DollarSign, Share2, Heart, Gift } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO'

const SocialPayments = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Target,
      title: "Group Goals",
      description: "Create shared funding goals with real-time progress tracking and milestone celebrations",
      benefits: ["Transparent progress", "Automated notifications", "Social engagement", "Milestone rewards"]
    },
    {
      icon: DollarSign,
      title: "Bill Splitting",
      description: "Split expenses instantly with smart calculation and automatic payment collection",
      benefits: ["Smart calculations", "Automatic reminders", "Multiple payment methods", "Expense tracking"]
    },
    {
      icon: Gift,
      title: "Crowdfunding",
      description: "Launch campaigns for any cause with built-in social sharing and engagement tools",
      benefits: ["Social sharing", "Campaign analytics", "Donor management", "Tax receipts"]
    }
  ]

  const useCases = [
    {
      title: "Wedding Planning",
      description: "Collect contributions from family and friends for wedding expenses",
      example: "$15,000 raised from 45 contributors in 3 months"
    },
    {
      title: "Team Events",
      description: "Organize company retreats, team building, and office parties",
      example: "100% participation rate with transparent expense tracking"
    },
    {
      title: "Community Projects",
      description: "Fund local initiatives, charity drives, and community improvements",
      example: "Local school raised $25,000 for new playground equipment"
    },
    {
      title: "Group Travel",
      description: "Plan and fund group trips with shared expense management",
      example: "12-person trip to Europe with seamless expense splitting"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Social Payments - Group Funding Made Simple | Corridor"
        description="Transform group funding with Corridor's social payment features. Group goals, bill splitting, and crowdfunding with full transparency and engagement."
        keywords="social payments, group funding, bill splitting, crowdfunding, shared expenses"
      />

      {/* Hero */}
      <section className="py-20 px-6 pt-32 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-8">
            <Users className="w-4 h-4" />
            <span>Social Payments</span>
          </div>
          
          <h1 className="text-6xl font-black text-slate-900 mb-8">
            Group Funding
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 leading-relaxed">
            Transform how groups collect, manage, and spend money together. From wedding planning to team events, 
            make group funding transparent, engaging, and effortless.
          </p>
          
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Start Your First Goal
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Everything You Need for Group Funding
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-8 bg-white rounded-3xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                  <feature.icon className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{feature.description}</p>
                
                <ul className="space-y-2">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-600 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
            Real-World Success Stories
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={useCase.title} className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{useCase.title}</h3>
                    <p className="text-slate-600 mb-4 leading-relaxed">{useCase.description}</p>
                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                      {useCase.example}
                    </div>
                  </div>
                </div>
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
              { step: 1, title: "Create Your Goal", description: "Set up your funding goal with target amount, deadline, and description" },
              { step: 2, title: "Invite Contributors", description: "Share your goal via link, QR code, or social media" },
              { step: 3, title: "Track Progress", description: "Watch contributions roll in with real-time updates and celebrations" },
              { step: 4, title: "Reach Your Goal", description: "Automatically collect funds and manage disbursements" }
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Transform Group Funding?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of groups already using Corridor for their funding needs
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Start Your First Goal
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default SocialPayments