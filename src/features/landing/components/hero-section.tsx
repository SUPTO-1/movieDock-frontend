export default function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pb-16 pt-10 sm:px-10 lg:px-12 lg:pb-24 lg:pt-16">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        Feature-based architecture for MovieDock
      </div>

      <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
              Streamline the frontend
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
              A clean movie product structure that scales with every feature.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Route files stay focused on composition while each feature owns its
              components, logic, and supporting modules. That keeps the codebase
              simple to navigate and easier to evolve.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-full bg-amber-300 px-6 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Explore features
            </a>
            <a
              href="#faq"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Read the structure
            </a>
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-white/6 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-sm font-medium text-slate-300">App Router</span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                Routing only
              </span>
            </div>
            <div className="space-y-4 pt-5 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">app/page.tsx</p>
                <p className="mt-1">
                  Composes feature sections directly with no business logic.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">features/landing</p>
                <p className="mt-1">
                  Owns the landing UI, its sections, and any landing-specific code.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">shared folders</p>
                <p className="mt-1">
                  Reserved for reusable code once the product needs it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
