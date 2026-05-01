import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
          404
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Page not found</h1>
          <p className="max-w-2xl text-base leading-8 text-white/70">
            The route you requested does not exist or is not published. Use one of the links below to return to a valid page.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/landing" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            Go to landing
          </Link>
          <Link to="/docs" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Open docs
          </Link>
          <Link to="/dashboard" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
