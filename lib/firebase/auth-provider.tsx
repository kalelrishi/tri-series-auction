"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  configured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: Boolean(auth),
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
