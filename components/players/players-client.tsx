"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  CheckCircle2,
  Loader2,
  Plus,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { playerRoleSchema, playerSchema } from "@/lib/firebase/schema";
import { createPlayer, listPlayers } from "@/services/players-service";
import type { CreatePlayerInput, PlayerDocument, PlayerRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type PlayerFormValues = {
  name: string;
  nickname: string;
  role: PlayerRole;
  battingStyle: string;
  bowlingStyle: string;
  basePrice: number;
  phone: string;
  photoUrl: string;
  active: boolean;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

const playerFormSchema = playerSchema.extend({
  basePrice: z.coerce.number().int().nonnegative(),
});

const defaultValues: PlayerFormValues = {
  name: "",
  nickname: "",
  role: "Batter",
  battingStyle: "",
  bowlingStyle: "",
  basePrice: 0,
  phone: "",
  photoUrl: "",
  active: true,
};

const roles = playerRoleSchema.options;

export function PlayersClient() {
  const [players, setPlayers] = useState<PlayerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function loadPlayers() {
    setLoading(true);
    try {
      setPlayers(await listPlayers());
    } catch {
      setToast({
        type: "error",
        message: "Unable to load players right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPlayers();
  }, []);

  const activeCount = useMemo(
    () => players.filter((player) => player.active).length,
    [players],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Player Pool
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
            Players
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {players.length} total, {activeCount} active
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add Player
        </Button>
      </div>

      <PlayersList players={players} loading={loading} />

      {open ? (
        <AddPlayerDialog
          onClose={() => setOpen(false)}
          onSaved={async () => {
            setOpen(false);
            setToast({
              type: "success",
              message: "Player added successfully.",
            });
            await loadPlayers();
          }}
          onError={() => {
            setToast({
              type: "error",
              message: "Unable to add player. Please check the form and try again.",
            });
          }}
        />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function PlayersList({
  players,
  loading,
}: {
  players: PlayerDocument[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
        <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
        Loading players...
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
        <UserRound className="size-10 text-slate-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">No players yet</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Add the first permanent player to start building the player pool.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Nickname</th>
              <th className="px-5 py-4 font-semibold">Role</th>
              <th className="px-5 py-4 font-semibold">Base Price</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {players.map((player) => (
              <tr key={player.id} className="text-slate-200">
                <td className="px-5 py-4 font-semibold text-white">
                  {player.name}
                </td>
                <td className="px-5 py-4 text-slate-300">
                  {player.nickname || "-"}
                </td>
                <td className="px-5 py-4">{player.role}</td>
                <td className="px-5 py-4">{formatPoints(player.basePrice)}</td>
                <td className="px-5 py-4">
                  <StatusBadge active={player.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-3 md:hidden">
        {players.map((player) => (
          <Card key={player.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-white">
                  {player.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {player.nickname || "No nickname"}
                </p>
              </div>
              <StatusBadge active={player.active} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Role</p>
                <p className="mt-1 font-semibold text-white">{player.role}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Base Price</p>
                <p className="mt-1 font-semibold text-white">
                  {formatPoints(player.basePrice)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function AddPlayerDialog({
  onClose,
  onSaved,
  onError,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: () => void;
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PlayerFormValues>({ defaultValues });

  async function onSubmit(values: PlayerFormValues) {
    const parsed = playerFormSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof PlayerFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    try {
      await createPlayer(cleanPlayerInput(parsed.data));
      reset(defaultValues);
      await onSaved();
    } catch {
      onError();
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Player Pool
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">Add Player</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-10 px-0"
            onClick={onClose}
            aria-label="Close add player dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message} required>
              <input
                className={inputClasses}
                placeholder="Player name"
                {...register("name")}
              />
            </Field>
            <Field label="Nickname" error={errors.nickname?.message}>
              <input
                className={inputClasses}
                placeholder="Optional"
                {...register("nickname")}
              />
            </Field>
            <Field label="Role" error={errors.role?.message}>
              <select className={inputClasses} {...register("role")}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Base Price" error={errors.basePrice?.message}>
              <input
                className={inputClasses}
                min={0}
                step={1}
                type="number"
                {...register("basePrice", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Batting Style" error={errors.battingStyle?.message}>
              <input
                className={inputClasses}
                placeholder="Right hand bat"
                {...register("battingStyle")}
              />
            </Field>
            <Field label="Bowling Style" error={errors.bowlingStyle?.message}>
              <input
                className={inputClasses}
                placeholder="Right arm pace"
                {...register("bowlingStyle")}
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input
                className={inputClasses}
                placeholder="Optional"
                {...register("phone")}
              />
            </Field>
            <Field label="Photo URL" error={errors.photoUrl?.message}>
              <input
                className={inputClasses}
                placeholder="https://..."
                {...register("photoUrl")}
              />
            </Field>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.04] p-4">
            <span>
              <span className="block text-sm font-semibold text-white">Active</span>
              <span className="mt-1 block text-sm text-slate-400">
                Active players are available for future auctions.
              </span>
            </span>
            <input
              className="size-5 accent-emerald-400"
              type="checkbox"
              {...register("active")}
            />
          </label>

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
              Save
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      className={cn(
        active
          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
          : "border-slate-400/25 bg-slate-400/10 text-slate-300",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
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

function cleanPlayerInput(values: z.infer<typeof playerFormSchema>): CreatePlayerInput {
  return {
    name: values.name,
    nickname: emptyToUndefined(values.nickname),
    role: values.role,
    battingStyle: emptyToUndefined(values.battingStyle),
    bowlingStyle: emptyToUndefined(values.bowlingStyle),
    basePrice: values.basePrice,
    phone: emptyToUndefined(values.phone),
    photoUrl: values.photoUrl,
    active: values.active,
  };
}

function emptyToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

const inputClasses =
  "min-h-11 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15";
