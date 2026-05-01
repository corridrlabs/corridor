import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { needsLegalAcceptance } from '../utils/legalConsent';
import { getPostAuthRoute } from '../utils/postAuthRoute';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-slate-700">{children}</div>
  </section>
);

export default function Legal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAcceptanceMode = searchParams.get('accept') === '1' || needsLegalAcceptance(user);
  const legalAccepted = !needsLegalAcceptance(user);

  const handleAccept = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authApi.grantConsent('terms_of_service', true);
      await authApi.grantConsent('privacy_policy', true);
      const refreshedUser = await refreshUser();
      const acceptedUser = {
        ...(refreshedUser || user),
        terms_accepted: true,
        privacy_accepted: true,
      };
      useAuthStore.getState().setUser(acceptedUser as any);
      setMessage('Your acceptance has been recorded.');
      navigate(getPostAuthRoute(acceptedUser as any), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Unable to record acceptance right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef4ff_35%,#f8fafc_70%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Terms and legal notice
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Terms of Service, Legal Notice, and Use Rules
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                These terms are intended to give Corridor and its stakeholders a strong operating framework: clear rules for users,
                clear limits on liability, clear controls around payments and sensitive data, and clear rights for us to enforce the
                platform against fraud, misuse, legal risk, or abuse.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Effective date</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">April 29, 2026</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Binding when accepted</div>
              </div>
            </div>
          </div>
        </div>

        {isAcceptanceMode && user && !legalAccepted && (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <Lock className="h-4 w-4" />
                  Required before access
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Accept the terms to continue into Corridor.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
                  This acceptance records your agreement to the Terms of Service and Privacy Policy. Once accepted, you can continue to
                  onboarding, wallet setup, and the dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={loading}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  {loading ? 'Recording acceptance...' : 'Accept and continue'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Review privacy policy
                </button>
              </div>
            </div>
            {message && <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</div>}
            {error && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
          </div>
        )}

        <div className="grid gap-6">
          <Section title="1. Agreement and scope">
            <p>These Terms govern your access to and use of Corridor, including the website, apps, APIs, dashboards, payment tools, onboarding flows, admin interfaces, documentation, and support channels.</p>
            <p>By creating an account, clicking an acceptance checkbox, using the platform, or continuing to use the platform after notice of updated terms, you accept these Terms and any incorporated policies.</p>
            <p>If you do not agree, do not create an account, do not continue onboarding, and do not use the service. We may require explicit acceptance at registration and again after material updates.</p>
          </Section>

          <Section title="2. Eligibility, accuracy, and account responsibility">
            <p>You must provide accurate, complete, and current information. You must keep your email, phone number, business details, and identity information up to date and notify us if anything materially changes.</p>
            <p>You are responsible for everything done through your credentials, sessions, API keys, admin tokens, linked devices, and approved integrations. If you suspect unauthorized use, you must tell us immediately.</p>
            <p>We may refuse, suspend, or close accounts that appear false, incomplete, duplicate, high-risk, or associated with legal, compliance, or fraud concerns.</p>
          </Section>

          <Section title="3. Lawful use and prohibited conduct">
            <p>You may use Corridor only for lawful business, operational, or personal finance purposes permitted by your jurisdiction and our policies. You must not use the service to break the law, evade sanctions, launder funds, finance terrorism, or conceal ownership.</p>
            <p>You may not reverse engineer, probe, scan, overload, interfere with, bypass, or attempt unauthorized access to the platform, infrastructure, data, APIs, wallets, or payment flows.</p>
            <p>You may not use the service for deceptive, abusive, harmful, discriminatory, harassing, or fraudulent activity, nor may you manipulate limits, abuse refunds, or misuse promotional or waitlist systems.</p>
          </Section>

          <Section title="4. Payments, balances, and settlement">
            <p>Payment features, wallet balances, settlement timing, payout timing, fee schedules, limits, and reversals depend on the relevant rail, region, provider, and risk controls. Posted values may not represent immediately spendable funds until settled.</p>
            <p>We may hold, delay, decline, reverse, or review transactions to manage fraud, compliance, chargebacks, provider errors, sanctions screening, or network risk. We may require additional verification before releasing funds.</p>
            <p>You are responsible for transaction instructions you submit, for checking recipient details, and for ensuring that your use of a payment rail is allowed in the recipient’s country and your own.</p>
          </Section>

          <Section title="5. Compliance, KYC, and risk controls">
            <p>Certain features require identity verification, KYC review, profile completion, and ongoing checks. We may ask for ID documents, business documents, source-of-funds details, beneficial ownership information, or additional evidence at any time.</p>
            <p>We may apply automated or manual review, sanctions screening, manual approvals, thresholds, and other controls. Failure to cooperate may result in account restrictions, frozen flows, or termination.</p>
            <p>You authorize us to use third-party service providers and compliance tools where necessary to operate the service and to meet legal obligations.</p>
          </Section>

          <Section title="6. Data use, privacy, and confidential information">
            <p>Our collection and use of personal data is described in the Privacy Policy. That policy forms part of this agreement. You should review it before using the service and whenever we update it.</p>
            <p>You agree not to disclose confidential platform details, internal screens, non-public workflows, security controls, pricing logic, roadmap information, or operational material you learn through privileged access.</p>
            <p>Each party must protect the other party’s confidential information and use it only for the intended purpose. We may disclose data where required by law, regulation, court order, or to protect the platform and its users.</p>
          </Section>

          <Section title="7. Intellectual property and brand protection">
            <p>Corridor owns or licenses the platform, trademarks, software, designs, interfaces, content, and documentation. You receive a limited, revocable, non-transferable right to use the service subject to these Terms.</p>
            <p>Nothing in these Terms transfers ownership of our software, processes, branding, or derivative works to you. You may not copy, scrape, publish, resell, or create a competing service from protected materials except where mandatory law clearly permits it.</p>
            <p>If you provide feedback, ideas, bug reports, or suggestions, we may use them without restriction and without obligation to compensate you.</p>
          </Section>

          <Section title="8. Third-party services and open-source dependencies">
            <p>Corridor may integrate third-party payment, cloud, communication, analytics, identity, and risk services. Those providers may have their own terms and policies, and your use of them may be subject to additional conditions.</p>
            <p>We are not responsible for outages, failures, pricing changes, or acts of third-party providers outside our reasonable control, although we will make commercially reasonable efforts to manage dependencies responsibly.</p>
            <p>Open-source software is used under the applicable open-source licenses. Those licenses continue to apply to the respective components and are not replaced by this agreement.</p>
          </Section>

          <Section title="9. Availability, beta features, and service changes">
            <p>We aim to provide a reliable service, but we do not guarantee uninterrupted or error-free operation. Scheduled maintenance, provider incidents, network congestion, security events, and legal obligations may affect availability.</p>
            <p>We may add, remove, rename, or change features at any time. Beta, experimental, or preview features are provided as-is and may change, break, or disappear without notice.</p>
            <p>You agree that feature flags, staged rollouts, and safety controls may be used to manage risk, quality, and compliance.</p>
          </Section>

          <Section title="10. Termination, suspension, and enforcement">
            <p>We may suspend, restrict, hold, or terminate access immediately if we suspect fraud, abuse, sanctions exposure, non-payment, legal risk, or any violation of these Terms or the Privacy Policy.</p>
            <p>We may also suspend access if required by a provider, regulator, bank, or other counterparty in the payment chain.</p>
            <p>After termination, certain records may be retained for legal, accounting, dispute, audit, or compliance reasons.</p>
          </Section>

          <Section title="11. Disclaimers">
            <p>To the fullest extent permitted by law, the service is provided on an “as is” and “as available” basis. We do not promise that the service will fit your exact purpose, that every integration will work everywhere, or that every event will be prevented.</p>
            <p>We do not provide legal, tax, accounting, investment, or regulatory advice. You are responsible for obtaining professional advice for your use case and jurisdiction.</p>
          </Section>

          <Section title="12. Liability limits and stakeholder protection">
            <p>To the fullest extent allowed by law, Corridor is not liable for indirect, incidental, special, punitive, or consequential damages, or for loss of profits, goodwill, data, or business opportunity.</p>
            <p>Our total liability for any claim will not exceed the amount you paid to Corridor in the period specified by applicable law or, where law allows, the smallest amount permitted for the relevant claim period.</p>
            <p>You agree that the limits above apply to our affiliates, officers, employees, contractors, licensors, and service providers.</p>
          </Section>

          <Section title="13. Indemnity">
            <p>You agree to defend, indemnify, and hold harmless Corridor and its stakeholders from claims, losses, liabilities, expenses, and costs arising from your misuse of the service, breach of these Terms, violation of law, infringement of rights, or use of the platform in a way that causes us harm.</p>
          </Section>

          <Section title="14. Governing law, dispute handling, and changes">
            <p>These Terms are governed by the law applicable to the service agreement or the mandatory law of the jurisdiction where the service is offered, unless a different rule is required by applicable law.</p>
            <p>We may update these Terms from time to time. Material changes will be communicated by posting the updated version and, where appropriate, by additional notice in the product or by email.</p>
            <p>Continued use after the effective date of updated Terms means you accept the changes to the extent permitted by law.</p>
          </Section>

          <Section title="15. Contact and notices">
            <p>For legal notices, contract issues, or rights requests, contact <a className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950" href="mailto:jamesthaura51@gmail.com">jamesthaura51@gmail.com</a>.</p>
            <p>We may also provide notices through the app, email, or other contact details associated with your account. It is your responsibility to keep those details current.</p>
          </Section>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <FileText className="h-4 w-4" />
                Acceptance
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">You must accept these terms to use Corridor.</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Acceptance is required at registration and for any existing account that has not yet accepted the current version.
                If you are not signed in, use the login or signup flow first.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={loading || legalAccepted}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {legalAccepted ? 'Already accepted' : loading ? 'Recording acceptance...' : 'Accept Terms and Privacy'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Go to signup
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Review privacy policy
              </button>
            </div>
          </div>
          {message && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>This document is a product policy, not a substitute for jurisdiction-specific legal advice. For launch in new countries, local counsel should review the final text.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
