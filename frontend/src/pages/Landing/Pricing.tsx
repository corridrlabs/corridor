import React, { useEffect, useState } from 'react'
import { Check, Star, Zap, Users, Workflow } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { billingApi, BillingFeeSchedule } from '../../api/billing'
import { CANONICAL_PRICING_CATALOG } from '../../config/pricingCatalog'
import { BillingCycle, getPlanPeriodLabel, getPlanPrice } from '../../utils/pricing'

const FALLBACK_FEE_SCHEDULE: BillingFeeSchedule = {
  currency: 'USD',
  ewa_withdrawal_flat_fee: 2.5,
  ewa_withdrawal_unit: 'per withdrawal',
  social_contribution_fee_rate: 0.01,
  payout_fee_rates: {
    free: 0.015,
    pro: 0.01,
    premium: 0.005,
    enterprise: 0.005,
  },
}

const Pricing = () => {
  const navigate = useNavigate()
  const [feeSchedule, setFeeSchedule] = useState<BillingFeeSchedule>(FALLBACK_FEE_SCHEDULE)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const cycleTone = billingCycle === 'yearly'
    ? {
        pill: 'bg-orange-600 text-white shadow-lg shadow-orange-200',
        accent: 'border-orange-200 bg-orange-50 text-orange-700',
        ring: 'ring-2 ring-orange-300 ring-offset-2 ring-offset-white',
        badge: 'Yearly billing active',
      }
    : {
        pill: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
        accent: 'border-blue-200 bg-blue-50 text-blue-700',
        ring: 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white',
        badge: 'Monthly billing active',
      }

  useEffect(() => {
    let mounted = true
    void billingApi.getFees()
      .then((data) => {
        if (!mounted) return
        setFeeSchedule({
          ...FALLBACK_FEE_SCHEDULE,
          ...data,
          payout_fee_rates: {
            ...FALLBACK_FEE_SCHEDULE.payout_fee_rates,
            ...(data?.payout_fee_rates || {}),
          },
        })
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`

  const plans = CANONICAL_PRICING_CATALOG.map((plan) => ({
    ...plan,
    price: getPlanPrice(plan, billingCycle),
    period: getPlanPeriodLabel(billingCycle).replace('/', ''),
    limitations: [] as string[],
    color: plan.popular ? "border-blue-500" : "border-slate-200",
  }))

  const handlePlanSelect = (planSlug: string) => {
    if (planSlug === "free") {
      navigate('/signup')
    } else if (planSlug === "pro") {
      navigate('/signup?plan=pro')
    } else {
      navigate('/contact')
    }
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-slate-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. Start free and scale as you grow.
          </p>
          <div className="mt-8 inline-flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
              {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                    billingCycle === cycle
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-400/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cycle === 'monthly' ? 'Monthly billing' : 'Yearly billing'}
                </button>
              ))}
            </div>
            <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
              billingCycle === 'yearly' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-blue-200 bg-blue-50 text-blue-700'
            }`}>
              <span className="inline-block h-2 w-2 rounded-full bg-current animate-pulse" />
              {billingCycle === 'yearly' ? 'Yearly pricing active' : 'Monthly pricing active'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`relative p-8 bg-white rounded-3xl border-2 ${plan.color} ${plan.popular ? 'shadow-2xl shadow-blue-200' : 'shadow-lg'} transition-all hover:shadow-xl ${cycleTone.ring}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-600 ml-2">/{plan.period}</span>}
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] ${cycleTone.accent}`}>
                  <span className="inline-block h-2 w-2 rounded-full bg-current" />
                  {billingCycle} pricing shown
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  What's included:
                </h4>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h5 className="font-medium text-slate-700 mb-3">Limitations:</h5>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-3">
                          <div className="w-5 h-5 mt-0.5 flex-shrink-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                          </div>
                          <span className="text-slate-500 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => handlePlanSelect(plan.slug)}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>All plans include 14-day free trial • No setup fees • Cancel anytime</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <div className="text-2xl font-black text-slate-900 mb-2">2.9%</div>
              <div className="text-sm text-slate-600">Transaction fee (Pro+)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-2">99.9%</div>
              <div className="text-sm text-slate-600">Uptime SLA</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 mb-2">24/7</div>
              <div className="text-sm text-slate-600">Support (Pro+)</div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Priority A</p>
                <h3 className="text-2xl font-black text-slate-900">Earned Wage Access</h3>
              </div>
            </div>
            <p className="text-slate-700 mb-4">
              Sell this to employers with 50+ employees. Billing is simple: the subscription plus a flat ${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)} fee per withdrawal.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 border border-emerald-100">
                <p className="text-sm text-slate-500">Flat fee</p>
                <p className="text-2xl font-black text-slate-900">${feeSchedule.ewa_withdrawal_flat_fee.toFixed(2)}</p>
                <p className="text-sm text-slate-600">{feeSchedule.ewa_withdrawal_unit}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-emerald-100">
                <p className="text-sm text-slate-500">Backend</p>
                <p className="text-2xl font-black text-slate-900">Tracked</p>
                <p className="text-sm text-slate-600">Shown in `fee_charged`</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-fuchsia-200 bg-fuchsia-50 p-8 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center">
                <Workflow className="w-6 h-6 text-fuchsia-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-700">Priority B</p>
                <h3 className="text-2xl font-black text-slate-900">Social Goals</h3>
              </div>
            </div>
            <p className="text-slate-700 mb-4">
              Designed for influencers and community leaders. Every contribution routed through Corridor carries a {formatRate(feeSchedule.social_contribution_fee_rate)} platform fee.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 border border-fuchsia-100">
                <p className="text-sm text-slate-500">Platform fee</p>
                <p className="text-2xl font-black text-slate-900">{formatRate(feeSchedule.social_contribution_fee_rate)}</p>
                <p className="text-sm text-slate-600">On contribution amount</p>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-fuchsia-100">
                <p className="text-sm text-slate-500">Audit trail</p>
                <p className="text-2xl font-black text-slate-900">Stored</p>
                <p className="text-sm text-slate-600">Recorded in transaction context</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Free', rate: feeSchedule.payout_fee_rates.free },
            { label: 'Pro', rate: feeSchedule.payout_fee_rates.pro },
            { label: 'Premium', rate: feeSchedule.payout_fee_rates.premium },
            { label: 'Enterprise', rate: feeSchedule.payout_fee_rates.enterprise },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatRate(item.rate)}</p>
              <p className="text-sm text-slate-600">Backend payout rate</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing
