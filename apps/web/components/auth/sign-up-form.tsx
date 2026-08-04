"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";

type FieldErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  consent?: string;
  general?: string;
};

function validate(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  agreedToTerms: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!fullName.trim()) errors.fullName = "Full name is required.";
  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address (e.g. you@example.com).";
  }
  if (!phone.trim()) errors.phone = "Phone number is required.";
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!agreedToTerms) {
    errors.consent = "You must agree to the Terms of Use and Privacy Policy to continue.";
  }
  return errors;
}

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const fieldErrors = validate(fullName, email, phone, password, agreedToTerms);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      router.push("/sign-in?registered=1");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("already")) {
        setErrors({ email: "An account with this email already exists." });
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: "Enter a valid email address." });
      } else {
        setErrors({ general: msg || "Something went wrong. Please try again." });
      }
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setErrors((prev) => ({ ...prev, fullName: undefined })); }}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="text"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={agreedToTerms}
            onCheckedChange={(checked) => {
              setAgreedToTerms(checked === true);
              setErrors((prev) => ({ ...prev, consent: undefined }));
            }}
            aria-invalid={!!errors.consent}
            className="mt-0.5"
          />
          <span>
            I agree to VEYRO&apos;s{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            , including the collection and use of my personal data as described.
          </span>
        </label>
        {errors.consent && <p className="text-xs text-destructive">{errors.consent}</p>}
      </div>
      {errors.general && <p className="text-sm text-destructive">{errors.general}</p>}
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
