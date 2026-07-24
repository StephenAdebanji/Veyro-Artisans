"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingSignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
