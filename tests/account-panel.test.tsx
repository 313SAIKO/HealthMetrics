import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  AccountPanel,
  openAccountPanel,
} from "../src/components/account/AccountPanel";
import { announceAccountChange } from "../src/hooks/useAccount";
import { apiRequest } from "../src/components/account/client";

const account = vi.hoisted(() => ({
  user: null as { id: string; name: string; email: string } | null,
  loading: false,
  error: false,
  refresh: vi.fn(),
}));

vi.mock("../src/hooks/useAccount", () => ({
  useAccount: () => account,
  announceAccountChange: vi.fn(),
}));
vi.mock("../src/components/account/client", async (original) => ({
  ...(await original<typeof import("../src/components/account/client")>()),
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  account.user = null;
  account.loading = false;
  account.error = false;
  account.refresh.mockReset();
  vi.mocked(apiRequest).mockReset();
  vi.mocked(announceAccountChange).mockReset();
});
afterEach(cleanup);

it("opens a collapsed disclosure, focuses its field, and restores focus and drafts when closed with Escape", async () => {
  render(<AccountPanel language="en" />);
  const toggle = screen.getByTestId("auth-toggle");
  const region = document.getElementById(toggle.getAttribute("aria-controls")!);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(region?.hidden).toBe(true);
  expect(screen.queryByRole("textbox", { name: "Email" })).toBeNull();
  expect(apiRequest).not.toHaveBeenCalled();

  toggle.focus();
  fireEvent.click(toggle);
  const email = screen.getByRole("textbox", {
    name: "Email",
  }) as HTMLInputElement;
  await waitFor(() => expect(document.activeElement).toBe(email));
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.change(email, { target: { value: "draft@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "FixturePassword7!" },
  });
  fireEvent.keyDown(email, { key: "Escape" });
  expect(region?.hidden).toBe(true);
  expect(document.activeElement).toBe(toggle);

  fireEvent.click(toggle);
  expect(email.value).toBe("draft@example.invalid");
  expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe(
    "FixturePassword7!",
  );
});

it("opens from a save anchor through the helper and can focus the sign-up name field", async () => {
  render(
    <>
      <a href="#account" onClick={() => openAccountPanel()}>
        Sign in to save
      </a>
      <AccountPanel language="en" />
    </>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Sign in to save" }));
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText("Email")),
  );
  act(() => openAccountPanel("sign-up"));
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText("Name")),
  );
  expect(
    screen.getByTestId("auth-signup-mode").getAttribute("aria-pressed"),
  ).toBe("true");
  expect(apiRequest).not.toHaveBeenCalled();
});

it("opens Create account directly while preserving the standard authentication fields", async () => {
  render(<AccountPanel language="th" />);
  fireEvent.click(screen.getByTestId("auth-create-account"));
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByTestId("auth-name")),
  );
  expect(screen.getByTestId("auth-toggle").getAttribute("aria-expanded")).toBe(
    "true",
  );
  expect(screen.getByTestId("auth-email").getAttribute("autoComplete")).toBe(
    "email",
  );
  expect(screen.getByTestId("auth-password").getAttribute("autoComplete")).toBe(
    "new-password",
  );
});

it("opens sign-in after logout and waits for the shared session to clear before focusing", async () => {
  account.user = {
    id: "fictional-user",
    name: "Demo",
    email: "demo@example.invalid",
  };
  vi.mocked(apiRequest).mockResolvedValue(undefined);
  const view = render(<AccountPanel language="en" showHistoryLink={false} />);
  expect(screen.queryByRole("link", { name: "Assessment history" })).toBeNull();
  fireEvent.click(screen.getByTestId("auth-signout"));
  await waitFor(() => expect(announceAccountChange).toHaveBeenCalledOnce());
  expect(apiRequest).toHaveBeenCalledWith("/api/auth/sign-out", {
    method: "POST",
    body: "{}",
  });
  account.user = null;
  view.rerender(<AccountPanel language="en" showHistoryLink={false} />);
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText("Email")),
  );
  expect(screen.getByTestId("auth-submit").closest("[hidden]")).toBeNull();
});

it("keeps session errors and retry available while the form is collapsed", () => {
  account.error = true;
  render(<AccountPanel language="en" />);
  expect(screen.getByRole("alert").textContent).toContain(
    "We could not check your session.",
  );
  expect(screen.getByTestId("auth-toggle").getAttribute("aria-expanded")).toBe(
    "false",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(account.refresh).toHaveBeenCalledOnce();
  expect(apiRequest).not.toHaveBeenCalled();
});
