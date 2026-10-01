import { test, expect } from "@playwright/test";
let pageErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
});
test.afterEach(() => {
  expect(pageErrors).toEqual([]);
});

test("overview is ready, the preview is interactive, and search navigates", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Quantum from Zero." }),
  ).toBeVisible();
  await expect(page.getByText("Local simulator ready")).toBeVisible();
  await page.getByRole("button", { name: "X", exact: true }).click();
  await expect(page.getByText("100.0%")).toBeVisible();
  await page.getByRole("button", { name: "Search anything…" }).click();
  await page
    .getByRole("textbox", { name: "Global search" })
    .fill("Bell States");
  await page
    .locator(".search-results")
    .getByText("Bell States & Entanglement")
    .click();
  await expect(page).toHaveURL("/learn/8");
  await expect(
    page.getByRole("heading", {
      name: "Bell States & Entanglement",
      exact: true,
    }),
  ).toBeVisible();
});

test("lesson completion persists in the dashboard after reload", async ({
  page,
}) => {
  await page.goto("/learn/1");
  await page.getByRole("button", { name: "C 8", exact: true }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await page.goto("/dashboard");
  await page.reload();
  await expect(page.getByText("1 / 18")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your First Qubit", exact: true }),
  ).toBeVisible();
});

test("Bell simulator returns only correlated counts from FastAPI", async ({
  page,
}) => {
  await page.goto("/playground/entanglement");
  await page.getByRole("button", { name: "03 After CNOT" }).click();
  await page.getByRole("button", { name: "Run locally" }).click();
  await expect(page.getByText("Qiskit Aer · local")).toBeVisible();
  await page.getByText("Ver counts y circuito ejecutado").click();
  const counts = JSON.parse(
    await page.locator(".details pre").first().innerText(),
  );
  expect(Object.keys(counts).sort()).toEqual(["00", "11"]);
  expect(Object.values(counts).reduce((a, b) => Number(a) + Number(b), 0)).toBe(
    1000,
  );
});

test("circuit builder adds gates and runs a deterministic circuit", async ({
  page,
}) => {
  await page.goto("/playground/circuit");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "X", exact: true }).click();
  await page.getByRole("button", { name: "Run locally" }).click();
  await expect(page.getByText("Qiskit Aer · local")).toBeVisible();
  await page.getByText("Ver counts y circuito ejecutado").click();
  await expect(page.locator(".details pre").first()).toContainText(
    '"01": 1000',
  );
});

test("restricted code runner rejects imports and runs valid Qiskit syntax", async ({
  page,
}) => {
  await page.goto("/playground/qiskit");
  await page
    .getByRole("textbox", { name: "Qiskit circuit code" })
    .fill('import os\nos.system("bad")');
  await page.getByRole("button", { name: "Run with Qiskit" }).click();
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Hadamard", exact: true }).click();
  await page.getByRole("button", { name: "Run with Qiskit" }).click();
  await expect(page.getByText("Qiskit Aer · local")).toBeVisible();
});

test("QUBO and bitstrings show correct penalties and score", async ({
  page,
}) => {
  await page.goto("/optimization/qubo");
  await page.getByRole("button", { name: "Verify QUBO with Qiskit" }).click();
  await expect(page.getByText("Offset:", { exact: false })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Bitstring", exact: true })
    .fill("000000");
  await expect(page.getByText("Invalid assignment")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Bitstring", exact: true })
    .fill("011001");
  await expect(page.getByText("Valid assignment")).toBeVisible();
  await expect(page.getByText("Business cost").locator("..")).toContainText(
    "9.0",
  );
});

test("comparison reports actual solver outputs and limitation", async ({
  page,
}) => {
  await page.goto("/optimization/compare");
  await page.getByRole("button", { name: "Run both solvers" }).click();
  await expect(page.getByText("011001").first()).toBeVisible();
  await expect(page.getByText("Best sample frequency")).toBeVisible();
  await expect(
    page.getByText("For small problems, classical solvers", { exact: false }),
  ).toBeVisible();
});

test("QAOA trace, samples and animation are functional", async ({ page }) => {
  await page.goto("/optimization/qaoa");
  await page.getByRole("button", { name: "Run QAOA", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Follow each evaluation." }),
  ).toBeVisible();
  await expect(page.getByText("Ideal validity")).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect
    .poll(() =>
      page.getByRole("slider", { name: "QAOA evaluation" }).inputValue(),
    )
    .not.toBe("0");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
});

test("a coding challenge executes and saves completion", async ({ page }) => {
  await page.goto("/challenges");
  await page
    .getByRole("textbox", { name: "Challenge code" })
    .fill(
      "from qiskit import QuantumCircuit\nqc = QuantumCircuit(1, 1)\nqc.h(0)\nqc.measure_all()",
    );
  await page.getByRole("button", { name: "Run & check challenge" }).click();
  await expect(page.getByText("Correct. Challenge completed!")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 / 10 completed")).toBeVisible();
});

test("all lesson routes, glossary and readiness are accessible", async ({
  page,
}) => {
  for (const path of [
    "/learn",
    "/learn/9",
    "/learn/12",
    "/learn/18",
    "/glossary",
    "/readiness",
    "/ionq",
    "/simulators/local",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.goto("/readiness");
  await page
    .getByRole("checkbox", { name: "I understand qubits", exact: true })
    .check();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "I understand qubits", exact: true }),
  ).toBeChecked();
});

test("mobile layout fits the viewport and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Quantum from Zero." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Learning path 18" }).click();
  await expect(page).toHaveURL("/learn");
  await page.goto("/optimization/qubo");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("light mode changes appearance without losing progress", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-theme",
    "dark",
  );
});
