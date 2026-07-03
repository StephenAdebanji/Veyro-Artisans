import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { NewRequestForm } from "@/components/dashboard/new-request-form";

export default function NewServiceRequestPage() {
  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/homeowner/dashboard"
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold">New service request</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us what needs fixing — verified artisans nearby will respond in real time.
        </p>
        <div className="mt-6">
          <Suspense>
            <NewRequestForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
