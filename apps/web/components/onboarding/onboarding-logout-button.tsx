"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingLogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </Button>
  );
}
