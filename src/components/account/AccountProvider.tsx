"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccountContext,
  accountSessionEvent,
  type AccountUser,
} from "../../hooks/useAccount";
import { apiRequest } from "./client";

interface SessionSnapshot {
  user: AccountUser | null;
  loading: boolean;
  error: boolean;
}

interface SessionRequest {
  generation: number;
  controller: AbortController;
  promise: Promise<void>;
}

/** A session belongs to this mounted app tree, never to a server module cache. */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({
    user: null,
    loading: true,
    error: false,
  });
  const mounted = useRef(false);
  const generation = useRef(0);
  const pending = useRef<SessionRequest | null>(null);

  const load = useCallback((invalidate = false): Promise<void> => {
    // Ordinary refreshes from several consumers share the same request.
    if (pending.current && !invalidate) return pending.current.promise;
    // An authentication mutation changes the cookie. Its new request must not
    // reuse a request that started with the previous authentication state.
    const requestGeneration = ++generation.current;
    pending.current?.controller.abort();
    const controller = new AbortController();
    setSnapshot((current) => ({ ...current, loading: true, error: false }));
    const promise = apiRequest<{ user: AccountUser } | null>(
      "/api/auth/get-session",
      { signal: controller.signal },
    )
      .then((session) => {
        if (mounted.current && generation.current === requestGeneration) {
          setSnapshot({
            user: session?.user ?? null,
            loading: false,
            error: false,
          });
        }
      })
      .catch(() => {
        if (mounted.current && generation.current === requestGeneration) {
          setSnapshot({ user: null, loading: false, error: true });
        }
      })
      .finally(() => {
        if (pending.current?.generation === requestGeneration)
          pending.current = null;
      });
    pending.current = { generation: requestGeneration, controller, promise };
    return promise;
  }, []);

  const refresh = useCallback(() => {
    void load();
  }, [load]);
  const cancelPending = useCallback(() => {
    ++generation.current;
    pending.current?.controller.abort();
    pending.current = null;
  }, []);
  useEffect(() => {
    mounted.current = true;
    const authenticationChanged = () => {
      void load(true);
    };
    window.addEventListener(accountSessionEvent, authenticationChanged);
    void load();
    return () => {
      mounted.current = false;
      cancelPending();
      window.removeEventListener(accountSessionEvent, authenticationChanged);
    };
  }, [load, cancelPending]);
  const value = useMemo(() => ({ ...snapshot, refresh }), [snapshot, refresh]);
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}
