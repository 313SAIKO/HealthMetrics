import { afterEach, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HomePage from "../src/components/health/HealthCalculator";
afterEach(cleanup);
it("clears stale results, retains empty input, localizes errors and document language", () => {
  render(<HomePage />);
  fireEvent.click(screen.getByRole("button", { name: "คำนวณผลลัพธ์" }));
  expect(screen.getAllByText("1,978.5").length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText(/น้ำหนัก/), { target: { value: "" } });
  expect(screen.queryByText("1,978.5")).toBeNull();
  expect((screen.getByLabelText(/น้ำหนัก/) as HTMLInputElement).value).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "คำนวณผลลัพธ์" }));
  expect(screen.getByText("กรอกน้ำหนัก 20–300 กก.")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByLabelText(/น้ำหนัก/));
  fireEvent.click(screen.getByRole("button", { name: "EN" }));
  expect(document.documentElement.lang).toBe("en");
  expect(screen.getByText("Enter a weight from 20 to 300 kg.")).toBeTruthy();
});

it("rejects children and withholds low-calorie plans", () => {
  render(<HomePage />);
  fireEvent.change(screen.getByLabelText("อายุ"), { target: { value: "12" } });
  fireEvent.click(screen.getByRole("button", { name: "คำนวณผลลัพธ์" }));
  expect(screen.getByText("รองรับอายุจำนวนเต็ม 20–78 ปี")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("อายุ"), { target: { value: "65" } });
  fireEvent.click(screen.getByLabelText("หญิง"));
  fireEvent.change(screen.getByLabelText(/น้ำหนัก/), { target: { value: "45" } });
  fireEvent.change(screen.getByLabelText(/ส่วนสูง/), {
    target: { value: "150" },
  });
  fireEvent.click(screen.getByRole("button", { name: "คำนวณผลลัพธ์" }));
  expect(screen.getAllByText("ไม่รองรับส่วนสูงนี้").length).toBe(4);
  fireEvent.click(screen.getByRole("button", { name: "ลดน้ำหนัก" }));
  expect(screen.getByRole("status").textContent).toContain("1,500");
});

it("keeps focus while correcting multiple invalid fields and refocuses only on submit", () => {
  render(<HomePage />);
  const age = screen.getByLabelText("อายุ") as HTMLInputElement;
  const weight = screen.getByLabelText(/น้ำหนัก/) as HTMLInputElement;
  const height = screen.getByLabelText(/ส่วนสูง/);
  const submit = screen.getByRole("button", { name: "คำนวณผลลัพธ์" });
  fireEvent.change(age, { target: { value: "" } });
  fireEvent.change(weight, { target: { value: "" } });
  fireEvent.click(submit);
  expect(document.activeElement).toBe(age);
  fireEvent.change(age, { target: { value: "2" } });
  expect(document.activeElement).toBe(age);
  fireEvent.change(age, { target: { value: "20" } });
  expect(age.value).toBe("20");
  height.focus();
  fireEvent.change(height, { target: { value: "170" } });
  expect(document.activeElement).toBe(height);
  fireEvent.click(submit);
  expect(document.activeElement).toBe(weight);
  height.focus();
  fireEvent.click(submit);
  expect(document.activeElement).toBe(weight);
});

it.each([
  [50, 164.4, "< 18.5", "น้ำหนักต่ำกว่าเกณฑ์"],
  [64.4, 160.5, "< 25.0", "น้ำหนักอยู่ในเกณฑ์ปกติ"],
  [75, 158.12, "< 30.0", "น้ำหนักเกินเกณฑ์"],
])(
  "keeps boundary BMI display consistent for %s kg / %s cm",
  (weight, height, display, category) => {
    render(<HomePage />);
    fireEvent.change(screen.getByLabelText(/น้ำหนัก/), {
      target: { value: String(weight) },
    });
    fireEvent.change(screen.getByLabelText(/ส่วนสูง/), {
      target: { value: String(height) },
    });
    fireEvent.click(screen.getByRole("button", { name: "คำนวณผลลัพธ์" }));
    expect(screen.getByText(display)).toBeTruthy();
    expect(screen.getAllByText(category).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText(display)).toBeTruthy();
    expect(screen.getByText(/Categories and plan availability/)).toBeTruthy();
  },
);

it("exposes the supported input ranges before validation", () => {
  render(<HomePage />);
  for (const [label, min, max] of [
    ["อายุ", "20", "78"],
    ["น้ำหนัก", "20", "300"],
    ["ส่วนสูง", "100", "220"],
  ]) {
    const input = screen.getByLabelText(new RegExp(label));
    expect(input.getAttribute("min")).toBe(min);
    expect(input.getAttribute("max")).toBe(max);
    const hint = document.getElementById(
      input.getAttribute("aria-describedby")!,
    );
    expect(hint?.textContent).toContain(min);
    expect(hint?.textContent).toContain(max);
  }
});

it("renders the requested initial language before any interaction", () => {
  render(<HomePage initialLanguage="en" />);
  expect(screen.getByRole("main").getAttribute("lang")).toBe("en");
  expect(
    screen.getByRole("button", { name: "Calculate my results" }),
  ).toBeTruthy();
  expect(document.documentElement.lang).toBe("en");
});
