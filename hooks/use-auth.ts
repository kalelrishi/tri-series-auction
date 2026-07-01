"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/firebase/auth-provider";

export function useAuth() {
  return useContext(AuthContext);
}
