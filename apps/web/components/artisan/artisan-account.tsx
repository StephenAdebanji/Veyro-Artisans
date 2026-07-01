"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  UserCircle,
  ShieldCheck,
  AlertOctagon,
  Settings2,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KycSection, type StagedItem, type CredentialRecord, type VerificationStatus } from "./kyc-section";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";

type Tab = "profile" | "kyc" | "disputes" | "settings";

interface ArtisanAccountProps {
  artisanId: string;
  email: string;
  verificationStatus: VerificationStatus;
  profilePhotoUrl: string | null;
  initialData: {
    firstName: string;
    lastName: string;
    bio: string;
    serviceRadiusKm?: number;
    city: string;
    state: string;
  };
  credentials: CredentialRecord[];
}

function LogDisputeSection() {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim() }),
    });
    setSubmitting(false);
    if (!res.ok) setError("Failed to submit. Please try again.");
    else {
      setSubmitted(true);
      setDescription("");
    }
  }

  return (
    <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900 dark:bg-rose-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-rose-600" />
        <h2 className="text-base font-semibold">Log a dispute</h2>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Had an issue with a job or homeowner? Let us know.
      </p>
      {submitted ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Dispute submitted — our team will be in touch.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <textarea
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            rows={3}
            placeholder="Describe the issue in detail…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-fit bg-rose-600 hover:bg-rose-700"
          >
            {submitting ? "Submitting…" : "Submit dispute"}
          </Button>
        </form>
      )}
    </section>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-base font-semibold">Appearance</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Choose how VEYRO looks for you.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {(
          [
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
            { value: "system", icon: Monitor, label: "System" },
          ] as const
        ).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function ArtisanAccount({
  artisanId,
  email,
  verificationStatus,
  profilePhotoUrl,
  initialData,
  credentials,
}: ArtisanAccountProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile tab state
  const [bio, setBio] = useState(initialData.bio);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    initialData.serviceRadiusKm?.toString() ?? "",
  );
  const [city, setCity] = useState(initialData.city);
  const [stateVal, setStateVal] = useState(initialData.state);

  // KYC tab state — lifted so Save/Cancel can control it from outside the section
  const [kycCredentials, setKycCredentials] = useState<CredentialRecord[]>(credentials);
  const [kycStatus, setKycStatus] = useState<VerificationStatus>(verificationStatus);
  const [kycStaged, setKycStaged] = useState<Record<string, StagedItem>>({});

  function handleKycStaged(categoryId: string, item: StagedItem) {
    setSaved(false);
    setSaveError(null);
    setKycStaged((prev) => ({ ...prev, [categoryId]: item }));
  }

  function handleSave() {
    setSaved(false);
    setSaveError(null);

    if (tab === "profile") {
      startSave(async () => {
        const body: Record<string, unknown> = { bio, city, state: stateVal };
        if (serviceRadiusKm) body.serviceRadiusKm = Number(serviceRadiusKm);
        const res = await fetch(`/api/artisans/${artisanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) setSaveError("Failed to save changes.");
        else {
          setSaved(true);
          router.refresh();
        }
      });
      return;
    }

    if (tab === "kyc") {
      const items = Object.entries(kycStaged);
      if (items.length === 0) return;
      startSave(async () => {
        const results = await Promise.allSettled(
          items.map(([, item]) =>
            fetch("/api/artisans/credentials", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: item.type, fileUrl: item.fileUrl }),
            }).then((res) => {
              if (!res.ok) throw new Error();
              return item;
            }),
          ),
        );

        const succeeded = results
          .filter((r): r is PromiseFulfilledResult<StagedItem> => r.status === "fulfilled")
          .map((r) => r.value);
        const failCount = results.filter((r) => r.status === "rejected").length;

        if (succeeded.length > 0) {
          setKycCredentials((prev) => [
            ...prev,
            ...succeeded.map((item) => ({
              id: `local-${Date.now()}-${item.type}`,
              type: item.type,
              fileUrl: item.fileUrl,
              status: "PENDING" as const,
              createdAt: new Date().toISOString(),
            })),
          ]);
          setKycStaged((prev) => {
            const next = { ...prev };
            for (const item of succeeded) {
              for (const [catId, s] of Object.entries(next)) {
                if (s.type === item.type && s.fileUrl === item.fileUrl) delete next[catId];
              }
            }
            return next;
          });
          if (kycStatus === "REJECTED") setKycStatus("UNVERIFIED");
          setSaved(true);
          router.refresh();
        }

        if (failCount > 0)
          setSaveError(`${failCount} document(s) failed to submit. Try saving again.`);
      });
      return;
    }
  }

  function handleCancel() {
    setSaved(false);
    setSaveError(null);
    if (tab === "profile") {
      setBio(initialData.bio);
      setServiceRadiusKm(initialData.serviceRadiusKm?.toString() ?? "");
      setCity(initialData.city);
      setStateVal(initialData.state);
    } else if (tab === "kyc") {
      setKycStaged({});
    }
  }

  const fullName = `${initialData.firstName} ${initialData.lastName}`.trim() || "—";

  return (
    <div className="mx-auto max-w-2xl flex-1 px-6 pb-16 pt-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border bg-muted/40 p-1">
        {(
          [
            { id: "profile" as Tab, icon: UserCircle, label: "Profile" },
            { id: "kyc" as Tab, icon: ShieldCheck, label: "KYC" },
            { id: "disputes" as Tab, icon: AlertOctagon, label: "Disputes" },
            { id: "settings" as Tab, icon: Settings2, label: "Settings" },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white shadow-sm dark:bg-card"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 flex min-h-[640px] flex-col gap-6">
        {tab === "profile" && (
          <>
            <section className="flex items-center gap-5 rounded-xl border bg-card p-6">
              <ProfilePhotoUpload
                currentUrl={profilePhotoUrl}
                name={fullName}
                endpoint={`/api/artisans/${artisanId}`}
                size={80}
              />
              <div>
                <p className="font-semibold">{fullName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click the camera icon to update your photo
                </p>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-base font-semibold">Account information</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your name and email cannot be changed here.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Full name</Label>
                  <Input value={fullName} disabled className="cursor-not-allowed opacity-60" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Email address</Label>
                  <Input value={email} disabled className="cursor-not-allowed opacity-60" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-base font-semibold">Profile &amp; location</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Shown to homeowners and used for matching.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell homeowners about your experience…"
                    value={bio}
                    onChange={(e) => { setBio(e.target.value); setSaved(false); }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => { setCity(e.target.value); setSaved(false); }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={stateVal} onChange={(e) => { setStateVal(e.target.value); setSaved(false); }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="radius">Service radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={serviceRadiusKm}
                    onChange={(e) => { setServiceRadiusKm(e.target.value); setSaved(false); }}
                    placeholder="e.g. 20"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "kyc" && (
          <KycSection
            credentials={kycCredentials}
            verificationStatus={kycStatus}
            staged={kycStaged}
            onStaged={handleKycStaged}
          />
        )}

        {tab === "disputes" && <LogDisputeSection />}

        {tab === "settings" && <AppearanceSection />}
      </div>

      {/* Global Save / Cancel — always visible */}
      <div className="mt-6 border-t pt-6">
        {saveError && <p className="mb-3 text-sm text-destructive">{saveError}</p>}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || tab === "disputes" || tab === "settings"}
            className="min-w-[100px]"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving || tab === "disputes" || tab === "settings"}
          >
            Cancel
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
