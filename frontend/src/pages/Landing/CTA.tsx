import React, { useState } from 'react'
import { ArrowRight, Loader2, Zap, Play, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { waitlistService } from '../../services/waitlistService'

const CTA = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      await waitlistService.join({
        name: '',
        email,
        company: '',
        segment: '',
        use_case: 'Quick signup from CTA',
        preferred_channel: 'webapp',
        volume: '',
        notes: 'Quick signup from landing page CTA'
      })
      setMessage('Success! Check your email for next steps.')
      setEmail('')
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          <span>Join 1000+ businesses already using Corridor</span>
        </div>

        <h2 className="text-5xl md:text-6xl font-black leading-tight mb-8">
          Ready to Transform Your
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            Business Operations?
          </span>
        </h2>

        <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Start with our free plan and experience the power of AI-driven business orchestration. 
          No credit card required, setup in minutes.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            Start Building Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/docs')}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </button>

          <button
            onClick={() => navigate('/contact')}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Book Demo
          </button>
        </div>

        {/* Quick Email Signup */}
        <div className="max-w-md mx-auto">
          <p className="text-blue-100 text-sm mb-4">Or get early access:</p>
          <form onSubmit={handleQuickSignup} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all outline-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Join'
              )}
            </button>
          </form>
          
          {message && (
            <div className={`mt-4 p-3 rounded-xl text-sm ${
              message.includes('Success') 
                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-black text-white mb-2">14 Days</div>
            <div className="text-sm text-blue-100">Free Trial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white mb-2">No Setup</div>
            <div className="text-sm text-blue-100">Fees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-white mb-2">Cancel</div>
            <div className="text-sm text-blue-100">Anytime</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA