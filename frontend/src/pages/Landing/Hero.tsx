import React from 'react'
import { ArrowRight, Play, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const Hero = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  return (
    <section className="relative py-20 px-6 pt-32 overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Business Orchestration Platform</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight text-slate-900 mb-8">
            The Future of
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Business Operations</span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Corridor orchestrates your entire business ecosystem with AI-powered workflows, multi-rail payments, and intelligent automation. From social payments to EWA, we handle the complexity so you can focus on growth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              Start Building
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900 mb-2">50+</div>
              <div className="text-sm text-slate-600 font-medium">Payment Rails</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900 mb-2">99.9%</div>
              <div className="text-sm text-slate-600 font-medium">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900 mb-2">24/7</div>
              <div className="text-sm text-slate-600 font-medium">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero