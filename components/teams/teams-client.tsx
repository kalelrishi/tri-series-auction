"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CheckCircle2,
  Copy,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { teamSchema } from "@/lib/firebase/schema";
import { getAuction } from "@/services/auctions-service";
import {
  createTeam,
  deleteTeam,
  DuplicateTeamCaptainError,
  listAvailableTeamCaptains,
  listTeams,
  TeamManagementLockedError,
  updateTeam,
} from "@/services/teams-service";
import type {
  AuctionDocument,
  CreateTeamInput,
  PlayerDocument,
  TeamDocument,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

type TeamFormValues = {
  name: string;
  captainId: string;
  color: string;
  budgetTotal: number;
};

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

type EditTeamFormValues = {
  name: string;
  color: string;
};

const TEAM_BUDGET = 400;
const teamFormSchema = teamSchema.pick({
  name: true,
  captainId: true,
  color: true,
});
const editTeamFormSchema = teamSchema.pick({
  name: true,
  color: true,
});

const defaultValues: TeamFormValues = {
  name: "",
  captainId: "",
  color: "#34d399",
  budgetTotal: TEAM_BUDGET,
};

export function TeamsClient({ auctionId }: { auctionId: string }) {
  const [auction, setAuction] = useState<AuctionDocument | null>(null);
  const [teams, setTeams] = useState<TeamDocument[]>([]);
  const [players, setPlayers] = useState<PlayerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDocument | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<TeamDocument | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  async function copyAccessCode(team: TeamDocument) {
    if (!team.captainAccessCode) {
      return;
    }

    await navigator.clipboard.writeText(team.captainAccessCode);
    setToast({
      type: "success",
      message: "Access code copied.",
    });
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextAuction, nextTeams, nextPlayers] = await Promise.all([
        getAuction(auctionId),
        listTeams(auctionId),
        listAvailableTeamCaptains(auctionId),
      ]);
      setAuction(nextAuction);
      setTeams(nextTeams);
      setPlayers(nextPlayers);
    } catch {
      setToast({
        type: "error",
        message: "Unable to load teams right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activePlayers = useMemo(
    () => players.filter((player) => player.active),
    [players],
  );
  const teamManagementLocked = auction ? auction.status !== "Draft" : false;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Team Management
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-white">
            Teams
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {teams.length} teams created for this auction
          </p>
        </div>
        {teamManagementLocked ? (
          <p className="rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
            Team management is locked because the auction has already started.
          </p>
        ) : null}
        <Button
          type="button"
          disabled={teamManagementLocked}
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          Create Team
        </Button>
      </div>

      <TeamsList
        locked={teamManagementLocked}
        loading={loading}
        onDelete={setDeletingTeam}
        onEdit={setEditingTeam}
        onCopyAccessCode={(team) => {
          void copyAccessCode(team);
        }}
        teams={teams}
      />

      {open ? (
        <CreateTeamDialog
          auctionId={auctionId}
          activePlayers={activePlayers}
          locked={teamManagementLocked}
          onClose={() => setOpen(false)}
          onSaved={async () => {
            setOpen(false);
            setToast({
              type: "success",
              message: "Team created successfully.",
            });
            await loadData();
          }}
          onError={(error) => {
            setToast({
              type: "error",
              message:
                error instanceof DuplicateTeamCaptainError
                  ? "This player is already captain of another team."
                  : error instanceof TeamManagementLockedError
                    ? error.message
                  : getErrorMessage(error),
            });
          }}
        />
      ) : null}

      {editingTeam ? (
        <EditTeamDialog
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={async (values) => {
            try {
              await updateTeam(auctionId, editingTeam.id, values);
              setEditingTeam(null);
              setToast({
                type: "success",
                message: "Team updated successfully.",
              });
              await loadData();
            } catch (error) {
              setToast({
                type: "error",
                message:
                  error instanceof TeamManagementLockedError
                    ? error.message
                    : getErrorMessage(error),
              });
            }
          }}
        />
      ) : null}

      {deletingTeam ? (
        <DeleteTeamDialog
          team={deletingTeam}
          onClose={() => setDeletingTeam(null)}
          onConfirm={async () => {
            try {
              await deleteTeam(auctionId, deletingTeam.id);
              setDeletingTeam(null);
              setToast({
                type: "success",
                message: "Team deleted successfully.",
              });
              await loadData();
            } catch (error) {
              setToast({
                type: "error",
                message:
                  error instanceof TeamManagementLockedError
                    ? error.message
                    : getErrorMessage(error),
              });
            }
          }}
        />
      ) : null}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function TeamsList({
  locked,
  loading,
  onDelete,
  onEdit,
  onCopyAccessCode,
  teams,
}: {
  locked: boolean;
  loading: boolean;
  onDelete: (team: TeamDocument) => void;
  onEdit: (team: TeamDocument) => void;
  onCopyAccessCode: (team: TeamDocument) => void;
  teams: TeamDocument[];
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (loading) {
    return (
      <Card className="flex min-h-56 items-center justify-center p-8 text-slate-300">
        <Loader2 className="mr-3 size-5 animate-spin text-cyan-200" />
        Loading teams...
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
        <Shield className="size-10 text-slate-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-white">No teams yet</p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
          Create the first team and assign an active player as captain.
        </p>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <Card key={team.id} className="overflow-visible">
          <div
            className="h-2"
            style={{ backgroundColor: team.color }}
            aria-hidden="true"
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold text-white">
                  {team.name}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <Trophy className="size-4 text-emerald-200" aria-hidden="true" />
                  {team.captainName || "Unknown captain"}
                </p>
              </div>
              <span
                className="size-10 shrink-0 rounded-md border border-white/15"
                style={{ backgroundColor: team.color }}
                aria-label={`${team.name} team color`}
              />
              {!locked ? (
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-10 px-0"
                    aria-label={`Open actions for ${team.name}`}
                    onClick={() =>
                      setOpenMenuId(openMenuId === team.id ? null : team.id)
                    }
                  >
                    <MoreVertical className="size-5" aria-hidden="true" />
                  </Button>
                  {openMenuId === team.id ? (
                    <div className="absolute right-0 top-11 z-20 w-40 rounded-md border border-white/10 bg-slate-950 p-1 shadow-2xl shadow-black/40">
                      <button
                        type="button"
                        className="flex min-h-9 w-full items-center gap-2 rounded px-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/8"
                        onClick={() => {
                          setOpenMenuId(null);
                          onEdit(team);
                        }}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit Team
                      </button>
                      <button
                        type="button"
                        className="flex min-h-9 w-full items-center gap-2 rounded px-3 text-left text-sm font-semibold text-red-200 hover:bg-red-300/10"
                        onClick={() => {
                          setOpenMenuId(null);
                          onDelete(team);
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete Team
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Budget Remaining</p>
                <p className="mt-1 font-semibold text-white">
                  {formatPoints(team.budgetRemaining)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Players</p>
                <p className="mt-1 font-semibold text-white">
                  {team.playersCount ?? team.players?.length ?? 0} / 7
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Spent Budget</p>
                <p className="mt-1 font-semibold text-white">
                  {formatPoints(team.budgetTotal - team.budgetRemaining)}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                <p className="text-slate-400">Captain</p>
                <p className="mt-1 truncate font-semibold text-white">
                  {team.captainName}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm text-slate-400">Access Code</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="min-w-0 truncate text-sm font-bold text-emerald-100">
                  {team.captainAccessCode ?? "Not generated"}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-8 px-2"
                  disabled={!team.captainAccessCode}
                  onClick={() => onCopyAccessCode(team)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm text-slate-400">Purchased Players</p>
              <div className="mt-3 grid gap-2">
                {(team.players ?? []).map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-slate-200">
                      {player.playerName}
                      {player.isCaptain ? " (Captain)" : ""}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {formatPoints(player.purchasePrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}

function CreateTeamDialog({
  activePlayers,
  auctionId,
  locked,
  onClose,
  onError,
  onSaved,
}: {
  activePlayers: PlayerDocument[];
  auctionId?: string;
  locked: boolean;
  onClose: () => void;
  onError: (error: unknown) => void;
  onSaved: () => Promise<void>;
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<TeamFormValues>({ defaultValues });
  const selectedColor = watch("color") || defaultValues.color;

  function handleColorChange(color: string) {
    setValue("color", color, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: TeamFormValues) {
    if (locked) {
      onError(new TeamManagementLockedError());
      return;
    }

    const captain = activePlayers.find(
      (player) => player.id === values.captainId,
    );

    if (!captain) {
      setError("captainId", {
        message: "Select an active player as captain.",
      });
      return;
    }

    if (!auctionId) {
      onError(new Error("Auction is not ready."));
      return;
    }

    const payload: CreateTeamInput = {
      name: values.name,
      captainId: values.captainId,
      captainName: captain.name,
      captainRole: captain.role,
      color: values.color,
      budgetTotal: TEAM_BUDGET,
    };
    const parsed = teamFormSchema.safeParse(payload);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string" && field in defaultValues) {
          setError(field as keyof TeamFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    try {
      await createTeam(auctionId, payload);
      reset(defaultValues);
      await onSaved();
    } catch (error) {
      onError(error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Team Management
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">Create Team</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-10 px-0"
            onClick={onClose}
            aria-label="Close create team dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Team Name" error={errors.name?.message} required>
            <input
              className={inputClasses}
              placeholder="Team name"
              {...register("name")}
            />
          </Field>

          <Field label="Captain" error={errors.captainId?.message} required>
            <select className={inputClasses} {...register("captainId")}>
              <option value="">Select active player</option>
              {activePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Team Color" error={errors.color?.message} required>
              <div className="flex items-center gap-3">
                <input
                  className="size-11 rounded-md border border-white/10 bg-slate-900 p-1"
                  type="color"
                  value={selectedColor}
                  onChange={(event) => handleColorChange(event.target.value)}
                />
                <input className={inputClasses} {...register("color")} />
              </div>
            </Field>

            <Field label="Budget">
              <input
                className={cn(inputClasses, "text-slate-400")}
                readOnly
                value={TEAM_BUDGET}
                {...register("budgetTotal", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={locked || isSubmitting || activePlayers.length === 0}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTeamDialog({
  onClose,
  onSaved,
  team,
}: {
  onClose: () => void;
  onSaved: (values: EditTeamFormValues) => Promise<void>;
  team: TeamDocument;
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<EditTeamFormValues>({
    defaultValues: {
      name: team.name,
      color: team.color,
    },
  });
  const selectedColor = watch("color") || defaultValues.color;

  function handleColorChange(color: string) {
    setValue("color", color, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: EditTeamFormValues) {
    const parsed = editTeamFormSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof EditTeamFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    await onSaved(parsed.data);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-xl rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Team Management
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">Edit Team</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="size-10 px-0"
            onClick={onClose}
            aria-label="Close edit team dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <form className="grid gap-4 p-5" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Team Name" error={errors.name?.message} required>
            <input
              className={inputClasses}
              placeholder="Team name"
              {...register("name")}
            />
          </Field>

          <Field label="Team Color" error={errors.color?.message} required>
            <div className="flex items-center gap-3">
              <input
                className="size-11 rounded-md border border-white/10 bg-slate-900 p-1"
                type="color"
                value={selectedColor}
                onChange={(event) => handleColorChange(event.target.value)}
              />
              <input className={inputClasses} {...register("color")} />
            </div>
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Pencil className="size-4" aria-hidden="true" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteTeamDialog({
  onClose,
  onConfirm,
  team,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  team: TeamDocument;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);

    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
            Delete Team
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">{team.name}</h3>
        </div>

        <div className="grid gap-4 p-5">
          <p className="text-sm leading-6 text-slate-300">
            This removes the team from the current auction only. This action
            cannot be undone.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={deleting}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="button" disabled={deleting} onClick={handleConfirm}>
              {deleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Delete Team
            </Button>
          </div>
        </div>
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

function formatPoints(points: number) {
  return new Intl.NumberFormat("en-IN").format(points);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error while creating team.";
}

const inputClasses =
  "min-h-11 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/15";
