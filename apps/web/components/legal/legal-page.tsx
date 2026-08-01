export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

export function LegalPage({
  title,
  intro,
  effectiveDate,
  sections,
}: {
  title: string;
  intro: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <div className="px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective {effectiveDate}</p>
        <p className="mt-5 text-muted-foreground">{intro}</p>

        <nav className="mt-8 rounded-xl border bg-muted/30 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
          <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-primary hover:underline">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <h2 className="text-xl font-bold">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
