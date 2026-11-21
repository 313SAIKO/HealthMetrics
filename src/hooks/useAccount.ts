"use client";

import { createContext, useContext } from "react";

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}
export interface AccountState {
  user: AccountUser | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

export const AccountContext = createContext<AccountState | null>(null);
export const accountSessionEvent = "healthmetrics:session-change";

export function announceAccountChange() {
  window.dispatchEvent(new Event(accountSessionEvent));
}

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account)
    throw new Error("useAccount must be used inside AccountProvider");
  return account;
}
