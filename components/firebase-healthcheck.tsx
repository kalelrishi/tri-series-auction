"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase/client";

type HealthcheckState =
  | { status: "loading" }
  | {
      status: "connected";
      authReady: boolean;
      documentStatus: string;
      timestamp: string;
    }
  | { status: "error"; message: string };

type HealthcheckDocument = {
  status?: string;
  timestamp?: Timestamp;
};

export function FirebaseHealthcheck() {
  const [state, setState] = useState<HealthcheckState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function readHealthcheck() {
      if (!db || !auth) {
        setState({
          status: "error",
          message: "Firebase is not configured for this environment.",
        });
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "healthcheck", "connection"));

        if (!active) {
          return;
        }

        if (!snapshot.exists()) {
          setState({
            status: "error",
            message: "Healthcheck document was not found.",
          });
          return;
        }

        const data = snapshot.data() as HealthcheckDocument;
        setState({
          status: "connected",
          authReady: Boolean(auth),
          documentStatus: data.status ?? "unknown",
          timestamp: data.timestamp
            ? data.timestamp.toDate().toLocaleString()
            : "Pending server timestamp",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to read the Firebase healthcheck document.",
        });
      }
    }

    void readHealthcheck();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firebase Healthcheck</CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "loading" ? (
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Loader2 className="size-5 animate-spin text-cyan-200" />
            Reading Firestore healthcheck...
          </div>
        ) : null}

        {state.status === "connected" ? (
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-100">
                <CheckCircle2 className="size-4" />
                Auth initialized
              </div>
              <p className="mt-2 text-slate-400">
                {state.authReady ? "Ready" : "Unavailable"}
              </p>
            </div>
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-100">
                <CheckCircle2 className="size-4" />
                Firestore read
              </div>
              <p className="mt-2 text-slate-400">
                status: {state.documentStatus}
              </p>
            </div>
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-100">
                <CheckCircle2 className="size-4" />
                Server timestamp
              </div>
              <p className="mt-2 text-slate-400">{state.timestamp}</p>
            </div>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="flex items-start gap-3 rounded-md border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
            <XCircle className="mt-0.5 size-5 shrink-0" />
            <p>{state.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
