"use client";

import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase/client";
import {
  findCaptainSessionByAccessCode,
  type CaptainSession,
} from "@/services/captain-auth-service";

const CAPTAIN_SESSION_STORAGE_KEY = "tri-series-captain-session";

type AuthContextValue = {
  user: User | null;
  captainSession: CaptainSession | null;
  loading: boolean;
  configured: boolean;
  role: "admin" | "captain" | "guest";
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  loginCaptain: (accessCode: string) => Promise<boolean>;
  logoutCaptain: () => void;
};

type AuthRole = AuthContextValue["role"];

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  captainSession: null,
  loading: false,
  configured: false,
  role: "guest",
  loginAdmin: async () => {},
  logoutAdmin: async () => {},
  loginCaptain: async () => false,
  logoutCaptain: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [captainSession, setCaptainSession] = useState<CaptainSession | null>(
    null,
  );
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    setCaptainSession(readCaptainSession());

    if (!auth) {
      return;
    }

    void setPersistence(auth, browserLocalPersistence);

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  async function loginAdmin(email: string, password: string) {
    if (!auth) {
      throw new Error("Firebase Authentication is not configured.");
    }

    clearCaptainSession();
    setCaptainSession(null);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logoutAdmin() {
    if (auth) {
      await signOut(auth);
    }
  }

  async function loginCaptain(accessCode: string) {
    const session = await findCaptainSessionByAccessCode(accessCode);

    if (!session) {
      return false;
    }

    if (auth?.currentUser) {
      await signOut(auth);
    }

    writeCaptainSession(session);
    setCaptainSession(session);
    setUser(null);
    return true;
  }

  function logoutCaptain() {
    clearCaptainSession();
    setCaptainSession(null);
  }

  const role: AuthRole = user ? "admin" : captainSession ? "captain" : "guest";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      captainSession,
      loading,
      configured: Boolean(auth),
      role,
      loginAdmin,
      logoutAdmin,
      loginCaptain,
      logoutCaptain,
    }),
    [captainSession, loading, role, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function readCaptainSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(CAPTAIN_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as CaptainSession;
  } catch {
    window.localStorage.removeItem(CAPTAIN_SESSION_STORAGE_KEY);
    return null;
  }
}

function writeCaptainSession(session: CaptainSession) {
  window.localStorage.setItem(
    CAPTAIN_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

function clearCaptainSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CAPTAIN_SESSION_STORAGE_KEY);
  }
}
