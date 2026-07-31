const featureCards = [
  {
    title: "Feature-owned UI",
    description:
      "Each feature keeps its own components, hooks, types, API calls, and validation in one place.",
  },
  {
    title: "Route composition only",
    description:
      "The app router imports the feature sections it needs and avoids business logic entirely.",
  },
  {
    title: "Shared code stays global",
    description:
      "Reusable utilities can live in shared folders without leaking feature concerns across the app.",
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
      <div className="grid gap-5 md:grid-cols-3">
        {featureCards.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/15 backdrop-blur"
          >
            <div className="mb-5 h-12 w-12 rounded-2xl bg-amber-300/15 ring-1 ring-amber-300/20" />
            <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 leading-7 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
