import React from 'react'
import { ArrowRight, Clock, DollarSign, Users, Workflow } from 'lucide-react'

const UseCases = () => {
  const useCases = [
    {
      icon: Users,
      title: "Group Fundraising",
      scenario: "Wedding Planning",
      before: {
        title: "Before Corridor",
        points: [
          "Multiple payment apps and spreadsheets",
          "Manual tracking of contributions",
          "No transparency for contributors",
          "Complex reconciliation process"
        ]
      },
      after: {
        title: "With Corridor",
        points: [
          "Single shared goal with real-time updates",
          "Automatic contribution tracking",
          "Full transparency and social feed",
          "Instant notifications and milestones"
        ]
      },
      metrics: { time: "90%", efficiency: "5x", satisfaction: "95%" }
    },
    {
      icon: Clock,
      title: "Employee Financial Wellness",
      scenario: "Retail Chain",
      before: {
        title: "Traditional Payroll",
        points: [
          "Employees wait 2 weeks for wages",
          "High turnover due to cash flow stress",
          "Expensive corridor loans and overdrafts",
          "Low employee satisfaction scores"
        ]
      },
      after: {
        title: "With EWA",
        points: [
          "Instant access to earned wages",
          "Reduced financial stress and turnover",
          "No interest or hidden fees",
          "Improved employee retention by 40%"
        ]
      },
      metrics: { retention: "40%", stress: "60%", satisfaction: "85%" }
    },
    {
      icon: Workflow,
      title: "Global Payment Operations",
      scenario: "Tech Startup",
      before: {
        title: "Manual Processes",
        points: [
          "Multiple payment providers to manage",
          "Manual routing and reconciliation",
          "High failure rates and delays",
          "Complex compliance requirements"
        ]
      },
      after: {
        title: "Automated Infrastructure",
        points: [
          "Single API for all payment rails",
          "Intelligent auto-routing and fallbacks",
          "99.9% success rate with real-time monitoring",
          "Built-in compliance and reporting"
        ]
      },
      metrics: { success: "99.9%", time: "80%", cost: "45%" }
    }
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Real-World Impact
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See how businesses transform their operations with Corridor's integrated platform
          </p>
        </div>

        <div className="space-y-16">
          {useCases.map((useCase, index) => (
            <div key={useCase.title} className="relative">
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Use Case Header */}
                <div className="lg:col-span-3 text-center mb-8">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-medium mb-4">
                    <useCase.icon className="w-5 h-5" />
                    <span>{useCase.title}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{useCase.scenario}</h3>
                </div>

                {/* Before */}
                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                  <h4 className="text-lg font-bold text-red-800 mb-4">{useCase.before.title}</h4>
                  <ul className="space-y-3">
                    {useCase.before.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                        <span className="text-red-700 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow */}
                <div className="flex justify-center items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* After */}
                <div className="p-6 bg-green-50 border border-green-100 rounded-2xl">
                  <h4 className="text-lg font-bold text-green-800 mb-4">{useCase.after.title}</h4>
                  <ul className="space-y-3">
                    {useCase.after.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                        <span className="text-green-700 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metrics */}
                <div className="lg:col-span-3 mt-8">
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                    <h5 className="text-lg font-bold text-blue-800 mb-4 text-center">Key Results</h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {Object.entries(useCase.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-2xl font-black text-blue-600">{value}</div>
                          <div className="text-sm text-blue-700 capitalize font-medium">
                            {key === 'time' ? 'Time Saved' : 
                             key === 'efficiency' ? 'More Efficient' :
                             key === 'satisfaction' ? 'Satisfaction' :
                             key === 'retention' ? 'Better Retention' :
                             key === 'stress' ? 'Less Stress' :
                             key === 'success' ? 'Success Rate' :
                             key === 'cost' ? 'Cost Reduction' : key}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {index < useCases.length - 1 && (
                <div className="mt-16 border-t border-slate-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UseCases