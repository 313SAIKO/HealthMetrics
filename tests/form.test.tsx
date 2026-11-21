import { afterEach, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HomePage from "../src/app/page";
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
