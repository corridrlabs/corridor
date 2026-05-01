export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 text-slate-900">
      <h1 className="text-3xl font-bold tracking-tight">About Corridor</h1>
      <p className="mt-4 text-slate-600">
        Corridor is a global financial operating system for modern teams. We help businesses collect payments,
        automate workflows, manage treasury, and build payment products using APIs.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Our mission</h2>
          <p className="mt-2 text-sm text-slate-600">Make global money movement simple, programmable, and reliable for every team.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">What we build</h2>
          <p className="mt-2 text-sm text-slate-600">Payment links, invoicing, payout orchestration, EWA, compliance workflows, and developer APIs.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">How to reach us</h2>
          <p className="mt-2 text-sm text-slate-600">For support or partnerships, contact jamesthaura51@gmail.com.</p>
        </div>
      </div>
    </div>
  );
}
