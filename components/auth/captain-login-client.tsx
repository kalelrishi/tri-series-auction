"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CaptainLoginClient() {
  const router = useRouter();
  const { loginCaptain } = useAuth();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const valid = await loginCaptain(accessCode);

    if (valid) {
      router.replace("/captain");
    } else {
      setError("Invalid Access Code");
    }

    setSubmitting(false);
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] w-full max-w-md place-items-center">
      <Card className="w-full p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Captain Access
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">Login</h2>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-200">
              Access Code
            </span>
            <input
              className={inputClasses}
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="TSA-9X4K2P"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="size-4" aria-hidden="true" />
            )}
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}

const inputClasses =
  "min-h-11 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15";
