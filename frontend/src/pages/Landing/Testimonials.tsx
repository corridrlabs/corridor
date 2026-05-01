import React from 'react'
import { Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CFO",
      company: "TechFlow Solutions",
      avatar: "👩‍💼",
      rating: 5,
      quote: "Corridor transformed our global payroll operations. What used to take days now happens in minutes, and our employees love the EWA feature.",
      metrics: "Reduced payroll processing time by 85%"
    },
    {
      name: "Marcus Johnson",
      role: "Founder",
      company: "GreenLeaf Logistics",
      avatar: "👨‍💼",
      rating: 5,
      quote: "The social payment features helped us organize our company retreat funding seamlessly. Everyone could contribute and track progress in real-time.",
      metrics: "100% employee participation in group goals"
    },
    {
      name: "Amara Okafor",
      role: "Head of Operations",
      company: "AfriTech Hub",
      avatar: "👩‍💻",
      rating: 5,
      quote: "Multi-rail payment support is a game-changer for our African operations. M-Pesa, bank transfers, and crypto - all in one platform.",
      metrics: "Expanded to 12 countries with ease"
    },
    {
      name: "David Rodriguez",
      role: "CTO",
      company: "FinanceFirst",
      avatar: "👨‍💻",
      rating: 5,
      quote: "The API integration was incredibly smooth. Our developers had everything up and running in less than a week.",
      metrics: "Integrated in 3 days vs 3 months"
    },
    {
      name: "Lisa Park",
      role: "HR Director",
      company: "RetailMax",
      avatar: "👩‍🎓",
      rating: 5,
      quote: "Employee retention improved dramatically after implementing EWA. Our staff feels more financially secure and valued.",
      metrics: "40% improvement in retention"
    },
    {
      name: "Ahmed Hassan",
      role: "Finance Manager",
      company: "BuildCorp",
      avatar: "👨‍🔧",
      rating: 5,
      quote: "Automated workflows saved us countless hours. Vendor payments that used to require manual approval now flow seamlessly.",
      metrics: "90% reduction in manual processes"
    }
  ]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Trusted by Growing Businesses
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See what our customers are saying about their experience with Corridor
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="relative p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-lg group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-white" />
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-4">"{testimonial.quote}"</p>
                <div className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                  {testimonial.metrics}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{testimonial.name}</div>
                  <div className="text-slate-600 text-xs">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Trusted by 1000+ Businesses</h3>
            <p className="text-slate-600">From startups to enterprises across 50+ countries</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">99.9%</div>
              <div className="text-sm text-slate-600 font-medium">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">4.9/5</div>
              <div className="text-sm text-slate-600 font-medium">Customer Rating</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">50+</div>
              <div className="text-sm text-slate-600 font-medium">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">24/7</div>
              <div className="text-sm text-slate-600 font-medium">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials