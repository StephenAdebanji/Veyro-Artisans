"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResetPasswordModal } from "./reset-password-modal";

interface ResetPasswordTriggerProps {
  kind: "artisan" | "homeowner";
  id: string;
  name: string;
}

export function ResetPasswordTrigger({ kind, id, name }: ResetPasswordTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <KeyRound className="h-3.5 w-3.5" /> Reset password
      </Button>
      <ResetPasswordModal open={open} kind={kind} id={id} name={name} onClose={() => setOpen(false)} />
    </>
  );
}
