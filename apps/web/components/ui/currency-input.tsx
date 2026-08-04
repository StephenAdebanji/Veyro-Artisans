"use client";

import * as React from "react";
import { Input } from "./input";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  /** Raw digits only, e.g. "7000" — same shape you'd pass to Number(). */
  value: string;
  onValueChange: (rawValue: string) => void;
}

// Matches the server-side cap on the Postgres INT4 columns this feeds
// (proposedPrice, budgetMin/Max) — stops a mistyped or pasted value from
// ever reaching a size that overflows INT4 in the first place.
const MAX_DIGITS = 9; // up to 999,999,999

/** Text input that displays comma-formatted digits ("1,000,000") while
 * typing, but reports back a plain numeric string via onValueChange — a
 * native type="number" input can't show commas at all. */
function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
  const displayValue = value ? Number(value).toLocaleString("en-US") : "";

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/[^\d]/g, "").slice(0, MAX_DIGITS);
    onValueChange(digitsOnly);
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}

export { CurrencyInput };
