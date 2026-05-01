import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ArrowRight, Globe, Play, Users, Workflow, Zap, Loader2, Check, Building, Server } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import SEO from '../components/SEO'
import { GlassButton } from '../components/ui/EnhancedComponents'
import { waitlistService } from '../services/waitlistService'
import { authApi } from '../api/auth'
import { getCalApi } from "@calcom/embed-react";
import { CANONICAL_PRICING_CATALOG } from '../config/pricingCatalog';
import { BillingCycle, getPlanPeriodLabel, getPlanPrice } from '../utils/pricing';

const Typewriter = ({ text, delay = 30, className = "" }: { text: string, delay?: number, className?: string }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return <span className={className}>{currentText}</span>;
};

const Landing = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  // Cal.com embed initialization
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ "namespace": "corridor-sales" });
      cal("ui", { "hideEventTypeDetails": false, "layout": "month_view" });
    })();
  }, []);

  const landingStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Corridor',
    description: 'Payments platform for modern teams worldwide - Connect accounts, accept payments, and manage money from one simple dashboard.',
    url: 'https://corridor.vercel.app',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web'
  };

  const v0Features = [
    {
      icon: Users,
      title: "Social Finance & Groups",
      description: "Create group contributions, split bills, and run fundraising goals with clear payment tracking."
    },
    {
      icon: Zap,
      title: "Public Invoices & Links",
      description: "Create payment links and invoices in seconds, then collect payments from anywhere."
    },
    {
      icon: Globe,
      title: "Developer APIs & Webhooks",
      description: "Integrate with our API, set up webhooks, and monitor payments in real time."
    },
    {
      icon: Workflow,
      title: "AI + MCP Integration",
      description: "Use MCP so your AI tools can check balances, create goals, and issue invoices safely."
    }
  ];

  const actualPlatformCapabilities = [
    {
      title: 'Sharable Payment Links',
      description: 'Create payment links and invoices to collect money quickly through cards and local methods.',
      channel: 'Invoices & Links',
    },
    {
      title: 'Social Group Goals',
      description: 'Create shared wallets to crowdfund objectives or pool money for projects, automatically tracking every member\'s contribution.',
      channel: 'Group Payments',
    },
    {
      title: 'Borderless Treasury',
      description: 'Manage balances and send payouts globally from one dashboard.',
      channel: 'Global Treasury',
    },
    {
      title: 'Developer APIs & MCP',
      description: 'Use our REST API, webhooks, and MCP server to build reliable payment automations.',
      channel: 'API & Webhooks',
    },
  ];

  const [waitlistForm, setWaitlistForm] = useState({
    name: '',
    email: '',
    company: '',
    segment: '',
    use_case: '',
    preferred_channel: 'webapp',
    volume: '',
    notes: '',
  });

  const handleWaitlistChange = (field: string, value: string) => {
    setWaitlistForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    setWaitlistMessage(null);
    try {
      await waitlistService.join({
        ...waitlistForm,
        use_case: waitlistForm.use_case || 'General interest',
        notes: waitlistForm.notes || 'From new landing page',
      });
      setWaitlistMessage('Success! You are on the list.');
      setWaitlistForm({
        name: '',
        email: '',
        company: '',
        segment: '',
        use_case: '',
        preferred_channel: 'webapp',
        volume: '',
        notes: '',
      });
    } catch (err: any) {
      setWaitlistMessage(err?.response?.data?.detail || 'Could not join. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/onboarding')
    }
  }

  const [features, setFeatures] = useState(v0Features);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setFeatures(prev => {
          const newFeatures = [...prev];
          const first = newFeatures.shift();
          newFeatures.push(first!);
          return newFeatures;
        });
        setTimeout(() => setIsAnimating(false), 50);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle hash-based navigation on mount and location change
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900">
      <SEO
        title="Global Payments Platform | Corridor"
        description="Collect payments, manage treasury, automate payroll and EWA, and integrate with APIs from one platform built for modern teams globally."
        keywords="global payments platform, treasury management, earned wage access, payroll automation, payment links, social payments, fintech API, Corridor documentation, Corridor features"
        canonicalUrl="/landing"
        structuredData={landingStructuredData}
      />

      {/* Hero Background with Connected Dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-30" viewBox="0 0 1920 1080">
          {/* Grid of dots */}
          {Array.from({ length: 150 }).map((_, i) => {
            const x = (i % 15) * 128 + 64;
            const y = Math.floor(i / 15) * 72 + 36;
            return (
              <circle
                key={`hero-dot-${i}`}
                cx={x}
                cy={y}
                r="2"
                fill="#3b82f6"
                className="animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            );
          })}
          
          {/* Connecting lines */}
          {Array.from({ length: 80 }).map((_, i) => {
            const startX = (i % 10) * 192 + 96;
            const startY = Math.floor(i / 10) * 108 + 54;
            const endX = startX + 96;
            const endY = startY + 54;
            
            return (
              <line
                key={`hero-line-${i}`}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#8b5cf6"
                strokeWidth="1"
                strokeDasharray="4,2"
                opacity="0.4">
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-12"
                  dur={`${3 + i * 0.2}s`}
                  repeatCount="indefinite" />
              </line>
            );
          })}
        </svg>
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="flex items-center justify-center py-20 px-6 pt-52">
          <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Payments platform for modern teams worldwide</span>
              </div>
              <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-slate-900 min-h-[180px]">
                <Typewriter text="Run your payments in one place" delay={40} />
              </h1>
              <p className="text-xl text-slate-600 max-w-xl leading-relaxed min-h-[60px]">
                Collect money, send payouts, and track every transaction from one dashboard.
              </p>

              <div className="flex flex-wrap gap-4 mt-4">
                <GlassButton variant="primary" size="lg" icon={Play} onClick={handleGetStarted} className="bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] hover:bg-[linear-gradient(135deg,#04070f_0%,#081229_48%,#0C2244_100%)] text-white shadow-lg shadow-blue-900/30">
                  Get started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </GlassButton>
                <GlassButton variant="secondary" size="lg" onClick={() => navigate('/docs')} className="bg-white/50 backdrop-blur-md border-slate-200 text-slate-700 hover:bg-white/80">
                  View docs
                </GlassButton>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              {/* Card texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #64748b 10px, #64748b 11px)`
              }} />

              <h3 className="font-bold text-2xl mb-2 text-slate-800">What you can do with Corridor</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Social Payments • Advanced EWA • AI-Powered Workflows & Connectors</p>

              <div className="grid gap-4 relative min-h-[320px]">
                {features.map((f, index) => (
                  <div
                    key={f.title}
                    className={`
                      flex items-start gap-4 p-4 rounded-2xl bg-white/60 border border-white/80 hover:border-blue-200 transition-all group
                      duration-300 ease-in-out
                      ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
                    `}
                    style={{
                      transitionDelay: isAnimating
                        ? `${index * 50}ms`
                        : `${(features.length - index) * 50}ms`
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{f.title}</div>
                      <div className="text-sm text-slate-600 leading-snug">
                        {f.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Workflows + Capabilities compact */}
        <section id="capabilities" className="py-20 px-6 relative">
          {/* Workflow background animation */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full opacity-50" viewBox="0 0 1000 600">
              <circle cx="200" cy="100" r="6" fill="#3b82f6" className="animate-pulse" />
              <circle cx="800" cy="200" r="6" fill="#8b5cf6" className="animate-pulse" />
              <circle cx="500" cy="500" r="6" fill="#10b981" className="animate-pulse" />
              <path d="M200,100 Q500,50 800,200 T500,500" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="2s" repeatCount="indefinite" />
              </path>
              <path d="M800,200 Q600,300 200,100" stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="8,4">
                <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>

          <div className="max-w-7xl mx-auto">
            <h3 className="text-4xl font-black mb-12 text-center text-slate-900">
              <Typewriter text="Core capabilities, ready from day one" delay={50} />
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {actualPlatformCapabilities.map((w, i) => (
                <div key={w.title} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {w.channel}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 mb-2">{w.title}</div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {w.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-4xl font-black mb-4 text-slate-900">
                How Corridor Works
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                From your first invoice to final payout, Corridor keeps your payment flow simple.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-sm border border-blue-100">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Set up your account</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Create your account and connect the wallets and accounts you need.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-sm border border-emerald-100">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Create and share</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Create invoices or funding goals and share them instantly. No coding needed.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-sm border border-purple-100">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Get paid</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Customers pay with cards or local methods, and you get instant confirmation.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-sm border border-orange-100">
                  4
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Store or send</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Keep funds in your balance or send payouts to bank and mobile accounts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers Overview */}
        <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-6 text-slate-900">
              Flexible plans, clear value
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Start small and upgrade as your team grows. Each plan adds more limits and support.
            </p>

            <div className="mb-12 flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => {
                  const isActive = billingCycle === cycle;
                  const cyclePill = cycle === 'yearly' 
                    ? 'bg-orange-600 shadow-orange-500/40 ring-orange-400/20' 
                    : 'bg-indigo-600 shadow-indigo-500/40 ring-indigo-400/20';
                    
                  return (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                        isActive
                          ? `${cyclePill} text-white shadow-lg ring-2`
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing'}
                    </button>
                  );
                })}
              </div>
              <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                billingCycle === 'yearly' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
              }`}>
                <span className="inline-block h-2 w-2 rounded-full bg-current animate-pulse" />
                {billingCycle === 'yearly' ? 'Yearly plan active' : 'Monthly plan active'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {CANONICAL_PRICING_CATALOG.filter(p => p.slug !== 'enterprise').map((plan) => (
                <div key={plan.slug} className={`p-8 rounded-3xl bg-white shadow-xl border-2 transition-all hover:shadow-2xl ${
                  plan.popular ? 'border-orange-400 ring-4 ring-orange-400/10' : 'border-slate-100'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${
                      plan.slug === 'free' ? 'bg-blue-50 text-blue-600' : plan.slug === 'pro' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {plan.slug === 'free' ? <Users className="w-8 h-8" /> : plan.slug === 'pro' ? <Zap className="w-8 h-8" /> : <Building className="w-8 h-8" />}
                    </div>
                    {plan.popular && (
                      <span className="bg-orange-500 text-white text-xs font-semibold">Popular</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-1 text-slate-900 text-left">{plan.name}</h3>
                  <div className="mb-4 text-left">
                    <span className="text-4xl font-black text-slate-900">{getPlanPrice(plan, billingCycle)}</span>
                    <span className="text-slate-500 text-sm">{getPlanPeriodLabel(billingCycle)}</span>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm text-left leading-relaxed">{plan.description}</p>
                  <ul className="text-left text-slate-700 space-y-3 text-sm mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/onboarding')}
                    className={`w-full py-4 rounded-2xl font-bold transition-all ${
                      plan.popular ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {plan.slug === 'free' ? 'Start Free' : plan.cta}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 text-left mb-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Server className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                  <p className="text-slate-400">Custom setup for high-volume teams.</p>
                </div>
              </div>
              <button 
                data-cal-namespace="corridor-sales"
                data-cal-link="james-thaura-qcpzwv/corridor-sales"
                data-cal-config='{"layout":"month_view", "hideEventTypeDetails":false, "useSlotsViewOnSmallScreen":"true"}'
                className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"
              >
                Contact Sales
              </button>
            </div>

            <Link to="/pricing" className="inline-flex items-center px-8 py-4 bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] text-white rounded-xl font-bold text-lg hover:bg-[linear-gradient(135deg,#04070f_0%,#081229_48%,#0C2244_100%)] transition-all shadow-xl shadow-blue-900/30">
              View full pricing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="p-12 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 blur-3xl rounded-full -mr-48 -mt-48" />

              <div className="relative z-10">
                <h2 className="text-4xl font-black mb-4 text-slate-900">
                  Join the waiting list
                </h2>
                <p className="text-lg text-slate-600 mb-10 max-w-2xl">
                  We prioritize teams moving money across borders or channels. Tell us your primary use case and we will route you to the right rail.
                </p>

                <form className="space-y-6" onSubmit={submitWaitlist}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <input required value={waitlistForm.name} onChange={(e) => handleWaitlistChange('name', e.target.value)} placeholder="John Doe" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
                      <input required type="email" value={waitlistForm.email} onChange={(e) => handleWaitlistChange('email', e.target.value)} placeholder="john@company.com" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Company</label>
                      <input value={waitlistForm.company} onChange={(e) => handleWaitlistChange('company', e.target.value)} placeholder="Acme Inc" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Industry Segment</label>
                      <input value={waitlistForm.segment} onChange={(e) => handleWaitlistChange('segment', e.target.value)} placeholder="e.g. Fintech, E-commerce" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Primary Use Case</label>
                    <input value={waitlistForm.use_case} onChange={(e) => handleWaitlistChange('use_case', e.target.value)} placeholder="e.g. USDC payroll to KES mobile money" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" />
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <button type="submit" disabled={waitlistSubmitting} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-2">
                      {waitlistSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Waitlist'
                      )}
                    </button>
                    <button
                      type="button"
                      data-cal-namespace="corridor-sales"
                      data-cal-link="james-thaura-qcpzwv/corridor-sales"
                      data-cal-config='{"layout":"month_view", "hideEventTypeDetails":false, "useSlotsViewOnSmallScreen":"true"}'
                      className="px-10 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                    >
                      Book a Demo
                    </button>
                  </div>

                  {waitlistMessage && (
                    <div className={`p-4 rounded-xl ${waitlistMessage.includes('Success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {waitlistMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

       
      </div>
    </div>
  )
}

export default Landing
