"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  general?: string;
};

function validate(fullName: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!fullName.trim()) errors.fullName = "Full name is required.";
  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address (e.g. you@example.com).";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export function SignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const fieldErrors = validate(fullName, email, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const msg: string = typeof body?.error === "string" ? body.error : "";
      if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("exist")) {
        setErrors({ email: "An account with this email already exists." });
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: "Enter a valid email address." });
      } else {
        setErrors({ general: msg || "Something went wrong. Please try again." });
      }
      setLoading(false);
      return;
    }

    router.push("/sign-in?registered=1");
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      {errors.general && <p className="text-sm text-destructive">{errors.general}</p>}
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
