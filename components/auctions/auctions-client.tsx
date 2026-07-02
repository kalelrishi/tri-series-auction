"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Timestamp } from "firebase/firestore";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gavel,
  Loader2,
  Plus,
  X,
  XCircle,
} from "lucide-react";
import { createAuction, listAuctions } from "@/services/auctions-service";
import type { AuctionDocument, CreateAuctionInput } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type AuctionFormValues = {
  name: string;
  date: string;
  startingBudget: number;
  maxPlayersPerTeam: number;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const defaultValues: AuctionFormValues = {
  name: "",
  date: new Date().toISOString().slice(0, 10),
  startingBudget: 400,
  maxPlayersPerTeam: 7,
};

export function AuctionsClient() {
  const [auctions, setAuctions] = useState<AuctionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function loadAuctions() {
    setLoading(true);
    try {
      setAuctions(await listAuctions());
    } catch {
      setToast({
        type: "error",
        message: "Unable to load auctions right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAuctions();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Auction Management
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
            Auctions
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {auctions.length} auctions available
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Create Auction
        </Button>
      </div>

      <AuctionsList auctions={auctions} loading={loading} />

      {open ? (
        <CreateAuctionDialog
          onClose={() => setOpen(false)}
          onSaved={async () => {
            setOpen(false);
            setToast({
              type: "success",
              message: "Auction created successfully.",
            });
            await loadAuctions();
          }}
          onError={() => {
            setToast({
              type: "error",
              message: "Unable to create auction. Please check the form and try again.",
            });
          }}
        />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function AuctionsList({
  auctions,
  loading,
}: {
  auctions: AuctionDocument[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
        <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
        Loading auctions...
      </Card>
    );
  }

  if (auctions.length === 0) {
    return (
      <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
        <Gavel className="size-10 text-slate-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">No auctions yet</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Create an auction to begin managing teams for that auction.
        </p>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {auctions.map((auction) => (
        <Card key={auction.id} className="h-full p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-white">
                {auction.name}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays className="size-4 text-emerald-200" aria-hidden="true" />
                {formatDate(auction.date)}
              </p>
            </div>
            <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              {auction.status}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <p className="text-slate-400">Starting Budget</p>
              <p className="mt-1 font-semibold text-white">
                {formatPoints(auction.startingBudget)}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <p className="text-slate-400">Max Players</p>
              <p className="mt-1 font-semibold text-white">
                {auction.maxPlayersPerTeam}
              </p>
            </div>
          </div>

          <Button
            asChild
            href={`/auctions/${auction.id}`}
            className="mt-5 w-full"
            variant="secondary"
          >
            Manage
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Card>
      ))}
    </section>
  );
}

function CreateAuctionDialog({
  onClose,
  onError,
  onSaved,
}: {
  onClose: () => void;
  onError: () => void;
  onSaved: () => Promise<void>;
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AuctionFormValues>({ defaultValues });

  async function onSubmit(values: AuctionFormValues) {
    if (!values.name.trim()) {
      setError("name", { message: "Auction name is required." });
      return;
    }

    const payload: CreateAuctionInput = {
      name: values.name,
      date: Timestamp.fromDate(new Date(`${values.date}T00:00:00`)),
      startingBudget: values.startingBudget,
      maxPlayersPerTeam: values.maxPlayersPerTeam,
    };

    try {
      await createAuction(payload);
      reset(defaultValues);
      await onSaved();
    } catch {
      onError();
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Auction Management
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">Create Auction</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-10 px-0"
            onClick={onClose}
            aria-label="Close create auction dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Auction Name" error={errors.name?.message} required>
            <input
              className={inputClasses}
              placeholder="Tri Series Auction"
              {...register("name")}
            />
          </Field>

          <Field label="Date" error={errors.date?.message}>
            <input className={inputClasses} type="date" {...register("date")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Starting Budget"
              error={errors.startingBudget?.message}
            >
              <input
                className={inputClasses}
                min={1}
                step={1}
                type="number"
                {...register("startingBudget", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Max Players Per Team"
              error={errors.maxPlayersPerTeam?.message}
            >
              <input
                className={inputClasses}
                min={1}
                step={1}
                type="number"
                {...register("maxPlayersPerTeam", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
            Status will be set to Draft.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              Create Auction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  children,
  error,
  label,
  required,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-200">
        {label}
        {required ? <span className="text-emerald-300"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-sm text-red-200">{error}</span> : null}
    </label>
  );
}

function Toast({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: ToastState;
}) {
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timeout);
  }, [onClose, toast]);

  if (!toast) {
    return null;
  }

  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg border border-white/10 bg-slate-950 p-4 text-sm text-white shadow-2xl shadow-black/40">
      <div className="flex gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            toast.type === "success" ? "text-emerald-300" : "text-red-300",
          )}
          aria-hidden="true"
        />
        <p className="leading-6">{toast.message}</p>
      </div>
    </div>
  );
}

function formatDate(value: AuctionDocument["date"]) {
  if (value && typeof value === "object" && "toDate" in value) {
    return value.toDate().toLocaleDateString();
  }

  return "Date not set";
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

const inputClasses =
  "min-h-11 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15";
