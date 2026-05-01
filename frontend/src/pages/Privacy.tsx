import React from 'react';
import { ShieldCheck, Database, Lock, Globe, FileText, AlertTriangle } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-slate-700">{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f7fbff_0%,#eef2ff_35%,#f8fafc_70%)] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy policy
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Privacy Policy and Data Handling Notice
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600">
                Corridor processes personal data to run the platform, secure accounts, support compliance, power payments, reduce fraud,
                and meet legal obligations. This policy explains what we collect, why we collect it, who we share it with, how long we keep it,
                and what rights you may have depending on your jurisdiction.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Effective date</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">April 29, 2026</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Principle</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Collect only what we need</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Section title="1. Scope">
            <p>This policy applies to users, customers, business contacts, partners, admins, vendors, and visitors interacting with Corridor websites, apps, APIs, onboarding flows, support channels, and documentation.</p>
            <p>It also covers personal data submitted during account creation, wallet setup, KYC, payment initiation, support, marketing, waitlists, compliance reviews, and dispute handling.</p>
          </Section>

          <Section title="2. Data we collect">
            <p>We may collect identity data, contact data, account credentials, business details, phone numbers, country information, KYC documents, sanctions or screening results, wallet addresses, transaction metadata, device identifiers, IP addresses, logs, and support messages.</p>
            <p>If you use payment or wallet features, we may also process beneficiary information, amount, currency, references, time stamps, provider status updates, risk signals, and operational audit trails.</p>
            <p>When you contact us, we may keep the messages, attachments, and metadata necessary to resolve the issue and preserve the record of support interactions.</p>
          </Section>

          <Section title="3. How we use data">
            <p>We use personal data to create and secure accounts, verify identity, enable payments, manage wallets, deliver support, detect fraud, comply with legal duties, and improve the service.</p>
            <p>We may also use data to enforce limits, resolve disputes, identify suspicious activity, protect our infrastructure, send essential notices, and comply with regulator or court requests.</p>
            <p>We do not use your personal data in a way that is inconsistent with the reasons described in this policy unless we tell you first and the law allows it.</p>
          </Section>

          <Section title="4. Legal bases and consent">
            <p>Where applicable, we rely on contract performance, legitimate interests, legal obligations, consent, and vital interests or public interest grounds where law permits.</p>
            <p>We ask for consent where the law requires it, including for certain communications, cookies, and some cross-border or optional processing activities. You may withdraw consent where the law allows, but some features may stop working if you do.</p>
          </Section>

          <Section title="5. Sharing and disclosure">
            <p>We may share data with payment rails, identity providers, cloud services, communications providers, analytics vendors, fraud tools, compliance tools, and professional advisers who help us operate the platform.</p>
            <p>We may also share information where required by law, to protect our rights or the rights of others, to respond to lawful requests, or to complete a transaction you asked us to process.</p>
            <p>We try to share the minimum necessary data for each purpose and to require appropriate contractual or technical protections from service providers.</p>
          </Section>

          <Section title="6. International transfers">
            <p>Corridor serves a global audience, so data may be processed in multiple jurisdictions. Depending on the destination and the relevant law, we may rely on adequacy rules, contractual safeguards, consent, or other lawful transfer mechanisms.</p>
            <p>We consider the nature of the data, the type of recipient, the security controls used, and the risks of cross-border transfer before sending personal data outside your country.</p>
          </Section>

          <Section title="7. Retention and deletion">
            <p>We keep personal data only for as long as needed for the stated purpose, legal obligations, dispute handling, fraud prevention, audit, tax, financial, and anti-money-laundering requirements.</p>
            <p>Different categories can have different retention periods. Some records may be anonymized or pseudonymized rather than fully deleted where the law or legitimate operational needs require continued record keeping.</p>
            <p>Where deletion is requested but legal retention is required, we may restrict processing, anonymize data, or keep only the minimum necessary record set.</p>
          </Section>

          <Section title="8. Security">
            <p>We use administrative, technical, and organizational measures intended to protect data, including access controls, encryption, audit logging, privileged access restrictions, secure coding practices, and monitoring.</p>
            <p>No system is perfectly secure. You should protect your account, use a strong password, secure your devices, and tell us promptly if you suspect abuse or unauthorized access.</p>
          </Section>

          <Section title="9. Your rights">
            <p>Depending on your location, you may have the right to access, correct, delete, export, object to, restrict, or withdraw consent for some processing activities. Some rights are limited by legal, accounting, or security duties.</p>
            <p>We may require verification before responding to a request. If your request affects data that we are legally required to keep, we may explain the limitation and keep only the minimum required record.</p>
          </Section>

          <Section title="10. Cookies and similar tools">
            <p>We use cookies, storage, and similar tools for authentication, session continuity, preferences, analytics, and service reliability. Some tools are essential and cannot be disabled without breaking the service.</p>
            <p>Where required by law, we request consent for non-essential cookies and provide controls to manage preferences.</p>
          </Section>

          <Section title="11. Children and vulnerable users">
            <p>The service is not intended for children below the minimum age permitted in your jurisdiction, or for anyone prohibited from using the service by law. If you believe a child has used the service improperly, contact us so we can review the account.</p>
          </Section>

          <Section title="12. Third-party and public-chain data">
            <p>Some features may interact with third-party systems or public blockchain infrastructure. Public-chain addresses and transaction references can become visible on distributed ledgers and may not be fully removable once published.</p>
            <p>We try to avoid putting unnecessary personal data on-chain and to reduce linkability where possible, but public ledgers have inherent transparency characteristics you should understand before using those features.</p>
          </Section>

          <Section title="13. Data subject requests and contact">
            <p>To request access, correction, deletion, portability, or to ask privacy questions, contact <a className="font-semibold text-slate-900 underline decoration-slate-300 hover:text-slate-950" href="mailto:jamesthaura51@gmail.com">jamesthaura51@gmail.com</a>.</p>
            <p>We may also respond through account notifications, support channels, or other contact details associated with your account.</p>
          </Section>

          <Section title="14. Updates to this policy">
            <p>We may update this policy to reflect product changes, legal changes, vendor changes, or operational changes. If the update is significant, we will post a revised effective date and may notify you in the product or by email.</p>
            <p>Continued use after the revised policy becomes effective means you agree to the updated policy to the extent permitted by law.</p>
          </Section>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                <Database className="h-4 w-4" />
                Data handling summary
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We keep your data only as long as needed, protect it with access controls and encryption where appropriate, and limit sharing to the minimum required for the platform to work.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Security</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Least privilege</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Transfers</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Safeguarded</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Retention</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Purpose-based</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>International privacy rules differ by country. This policy is a product policy and should be aligned with local counsel before launch or expansion.</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <Globe className="h-3.5 w-3.5" />
            Global processing notice
            <Lock className="h-3.5 w-3.5" />
            Confidential systems protection
            <FileText className="h-3.5 w-3.5" />
            Records and auditability
          </div>
        </div>
      </div>
    </div>
  );
}
