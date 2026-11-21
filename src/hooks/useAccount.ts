"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../components/account/client";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}
const sessionEvent = "healthmetrics:session-change";

export function announceAccountChange() {
  window.dispatchEvent(new Event(sessionEvent));
}

export function useAccount() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const session = await apiRequest<{ user: AccountUser } | null>(
          "/api/auth/get-session",
        );
        if (active) setUser(session?.user ?? null);
      } catch {
        if (active) {
          setError(true);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    window.addEventListener(sessionEvent, refresh);
    return () => window.removeEventListener(sessionEvent, refresh);
  }, [refresh]);
  return { user, loading, error, refresh };
}
