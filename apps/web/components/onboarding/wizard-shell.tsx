import Link from "next/link";

const STEP_LABELS = [
  "Basic info",
  "Professional",
  "Location",
  "Verification",
  "Proof of address",
  "Credentials",
  "Portfolio",
  "Availability",
];

export function WizardShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            V
          </span>
          VEYRO
        </Link>
      </header>
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Join VEYRO as an artisan</h1>
            <span className="text-sm text-muted-foreground">
              {step} / {STEP_LABELS.length}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = index + 1;
              const isDone = stepNumber < step;
              const isCurrent = stepNumber === step;
              return (
                <span
                  key={label}
                  className={[
                    "rounded-full px-3 py-1.5 text-sm",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "border text-muted-foreground",
                  ].join(" ")}
                >
                  {stepNumber} {label}
                </span>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border bg-card p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
