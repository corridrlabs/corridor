import React from 'react'
import { Bot, Building2, CreditCard, Database, Smartphone, Workflow } from 'lucide-react'

const Integrations = () => {
  const integrationCategories = [
    {
      title: "MCP (Model Context Protocol)",
      description: "AI agents that understand your business context and automate financial operations",
      icon: Bot,
      color: "from-purple-500 to-pink-500",
      featured: true,
      integrations: [
        { name: "Claude Desktop", logo: "🤖", description: "Native AI assistant integration" },
        { name: "Cursor IDE", logo: "💻", description: "Code with financial context" },
        { name: "Continue.dev", logo: "🔄", description: "AI-powered development" },
        { name: "Custom Agents", logo: "⚡", description: "Build your own AI workflows" }
      ]
    },
    {
      title: "ERP Systems",
      description: "Seamless integration with your existing business systems",
      icon: Building2,
      color: "from-blue-500 to-cyan-500",
      integrations: [
        { name: "SAP", logo: "📊" },
        { name: "Oracle", logo: "🏢" },
        { name: "Odoo", logo: "📈" },
        { name: "Xero", logo: "💼" }
      ]
    },
    {
      title: "Payment Rails",
      description: "Global payment infrastructure at your fingertips",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-500",
      integrations: [
        { name: "Stripe", logo: "💳" },
        { name: "Circle USDC", logo: "🪙" },
        { name: "M-Pesa", logo: "📱" },
        { name: "Flutterwave", logo: "🌊" }
      ]
    },
    {
      title: "Blockchain Networks",
      description: "Multi-chain support for Web3 operations",
      icon: Database,
      color: "from-orange-500 to-red-500",
      integrations: [
        { name: "Solana", logo: "☀️" },
        { name: "Ethereum", logo: "💎" },
        { name: "Polygon", logo: "🔷" },
        { name: "Base", logo: "🔵" }
      ]
    },
    {
      title: "Communication",
      description: "Native integration with messaging platforms",
      icon: Smartphone,
      color: "from-green-500 to-emerald-500",
      integrations: [
        { name: "WhatsApp", logo: "💬" },
        { name: "Slack", logo: "💼" },
        { name: "SMS/USSD", logo: "📲" },
        { name: "Email", logo: "📧" }
      ]
    },
    {
      title: "Workflow Tools",
      description: "Automate processes across your tech stack",
      icon: Workflow,
      color: "from-indigo-500 to-purple-500",
      integrations: [
        { name: "Zapier", logo: "⚡" },
        { name: "Make", logo: "🔧" },
        { name: "n8n", logo: "🔗" },
        { name: "Custom APIs", logo: "🔌" }
      ]
    }
  ]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Powerful Integrations
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Connect Corridor to your existing tools and unlock the full potential of your business ecosystem
          </p>
        </div>

        {/* MCP Flagship Feature */}
        <div className="mb-16 p-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">AI-First Financial Operations</h3>
                <p className="text-purple-100">Model Context Protocol (MCP) Integration</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">What AI Agents Can Do</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Process payroll with EWA calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Create and manage crowdfunding campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Monitor treasury balances and generate reports
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Automate invoice creation and payment collection
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Supported AI Platforms</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🤖</div>
                    <div className="text-xs font-medium">Claude Desktop</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">💻</div>
                    <div className="text-xs font-medium">Cursor IDE</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🔄</div>
                    <div className="text-xs font-medium">Continue.dev</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-xs font-medium">Custom Agents</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                Get Started with MCP
              </button>
              <button className="border border-white/30 text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                View Documentation
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {integrationCategories.map((category) => (
            <div key={category.title} className="group">
              <div className="relative p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${category.color} rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title}</h3>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed">{category.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {category.integrations.map((integration) => (
                      <div key={integration.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-lg">{integration.logo}</span>
                        <span className="text-xs font-medium text-slate-700">{integration.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Stats */}
        <div className="mt-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-purple-600 mb-2">15+</div>
              <div className="text-sm text-slate-600 font-medium">MCP Tools Available</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">50+</div>
              <div className="text-sm text-slate-600 font-medium">Payment Rails</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">200+</div>
              <div className="text-sm text-slate-600 font-medium">Total Integrations</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-2">24/7</div>
              <div className="text-sm text-slate-600 font-medium">AI Automation</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Integrations