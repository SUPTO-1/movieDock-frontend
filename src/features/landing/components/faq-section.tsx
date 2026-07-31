const faqs = [
  {
    question: "Why keep the app folder routing-only?",
    answer:
      "It makes route files predictable and removes accidental business logic from navigation concerns.",
  },
  {
    question: "Where do feature-specific modules go?",
    answer:
      "Inside the owning feature folder under components, api, hooks, types, and validation.",
  },
  {
    question: "What belongs in shared folders?",
    answer:
      "Only reusable code that is truly not tied to a single feature, such as common UI or utilities.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-7xl px-6 pb-16 sm:px-10 lg:px-12 lg:pb-24">
      <div className="rounded-4xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            Architecture notes
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The structure stays simple: features own logic, routes only assemble.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 leading-7 text-slate-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
