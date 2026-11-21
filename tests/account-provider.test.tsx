import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AccountProvider } from "../src/components/account/AccountProvider";
import {
  announceAccountChange,
  useAccount,
  type AccountUser,
} from "../src/hooks/useAccount";
import { apiRequest } from "../src/components/account/client";

vi.mock("../src/components/account/client", () => ({ apiRequest: vi.fn() }));

type Session = { user: AccountUser } | null;
const accountA: Session = {
  user: { id: "account-a", name: "A", email: "a@example.test" },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function Consumer({ name }: { name: string }) {
  const account = useAccount();
  return (
    <section>
      <output data-testid={`state-${name}`}>
        {account.loading
          ? "loading"
          : account.error
            ? "error"
            : (account.user?.id ?? "guest")}
      </output>
      <button type="button" onClick={account.refresh}>
        Refresh {name}
      </button>
    </section>
  );
}

function TwoConsumers() {
  return (
    <AccountProvider>
      <Consumer name="first" />
      <Consumer name="second" />
    </AccountProvider>
  );
}

function expectSharedState(value: string) {
  expect(screen.getByTestId("state-first").textContent).toBe(value);
  expect(screen.getByTestId("state-second").textContent).toBe(value);
}

beforeEach(() => {
  vi.mocked(apiRequest).mockReset();
});
afterEach(cleanup);

it("loads one shared session for two consumers and deduplicates concurrent refreshes", async () => {
  const request = deferred<Session>();
  vi.mocked(apiRequest).mockReturnValue(request.promise);
  render(<TwoConsumers />);
  expectSharedState("loading");
  expect(apiRequest).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Refresh first" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh second" }));
  expect(apiRequest).toHaveBeenCalledTimes(1);
  await act(async () => {
    request.resolve(accountA);
  });
  expectSharedState("account-a");
});

it("shares failure and recovers all consumers through one shared retry", async () => {
  vi.mocked(apiRequest).mockRejectedValueOnce(new Error("Offline"));
  render(<TwoConsumers />);
  await waitFor(() => expectSharedState("error"));
  expect(apiRequest).toHaveBeenCalledTimes(1);
  const retry = deferred<Session>();
  vi.mocked(apiRequest).mockReturnValueOnce(retry.promise);
  fireEvent.click(screen.getByRole("button", { name: "Refresh first" }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh second" }));
  expectSharedState("loading");
  expect(apiRequest).toHaveBeenCalledTimes(2);
  await act(async () => {
    retry.resolve(accountA);
  });
  expectSharedState("account-a");
});

it("aborts and ignores an old session response after sign-out invalidates authentication", async () => {
  vi.mocked(apiRequest).mockResolvedValueOnce(accountA);
  render(<TwoConsumers />);
  await waitFor(() => expectSharedState("account-a"));
  const old = deferred<Session>();
  vi.mocked(apiRequest)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(null);
  fireEvent.click(screen.getByRole("button", { name: "Refresh first" }));
  expectSharedState("loading");
  const oldSignal = vi.mocked(apiRequest).mock.calls[1][1]?.signal;
  act(() => announceAccountChange());
  expect(apiRequest).toHaveBeenCalledTimes(3);
  expect(oldSignal?.aborted).toBe(true);
  await waitFor(() => expectSharedState("guest"));
  // Deliberately ignore AbortSignal in this mock to exercise the generation guard.
  await act(async () => {
    old.resolve(accountA);
  });
  expectSharedState("guest");
});

it("discards StrictMode's cleaned-up request and removes its listener on unmount", async () => {
  const cleanedUp = deferred<Session>();
  const current = deferred<Session>();
  vi.mocked(apiRequest)
    .mockReturnValueOnce(cleanedUp.promise)
    .mockReturnValueOnce(current.promise);
  const page = render(
    <StrictMode>
      <TwoConsumers />
    </StrictMode>,
  );
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect(vi.mocked(apiRequest).mock.calls[0][1]?.signal?.aborted).toBe(true);
  await act(async () => {
    current.resolve(null);
  });
  expectSharedState("guest");
  await act(async () => {
    cleanedUp.resolve(accountA);
  });
  expectSharedState("guest");
  const pendingAtUnmount = deferred<Session>();
  vi.mocked(apiRequest).mockReturnValueOnce(pendingAtUnmount.promise);
  fireEvent.click(screen.getByRole("button", { name: "Refresh first" }));
  expect(apiRequest).toHaveBeenCalledTimes(3);
  page.unmount();
  expect(vi.mocked(apiRequest).mock.calls[2][1]?.signal?.aborted).toBe(true);
  act(() => announceAccountChange());
  expect(apiRequest).toHaveBeenCalledTimes(3);
});

it("keeps session state isolated between separate provider trees", async () => {
  const accountB: Session = {
    user: { id: "account-b", name: "B", email: "b@example.test" },
  };
  vi.mocked(apiRequest)
    .mockResolvedValueOnce(accountA)
    .mockResolvedValueOnce(accountB);
  render(
    <>
      <AccountProvider>
        <Consumer name="first" />
      </AccountProvider>
      <AccountProvider>
        <Consumer name="second" />
      </AccountProvider>
    </>,
  );
  await waitFor(() => {
    expect(screen.getByTestId("state-first").textContent).toBe("account-a");
    expect(screen.getByTestId("state-second").textContent).toBe("account-b");
  });
  expect(apiRequest).toHaveBeenCalledTimes(2);
});
