import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", (e) => list.push(e.message));
  page.on("console", (m) => m.type() === "error" && list.push(m.text()));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "browser console errors").toEqual([]);
});

async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
}

test("first visit asks for the explanation language and remembers it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Русский – китайский" }).click();
  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Выберите уровень HSK");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.goto("/");
  await expect(page).toHaveURL(/\/ru$/);
});

test("dashboard shows HSK 1–6 and 7–9 with the 2025 syllabus word counts", async ({ page }) => {
  await page.goto("/en");
  const levels = page.locator("main ul > li a");
  await expect(levels).toHaveCount(7);
  const counts = ["300 words", "204 words", "507 words", "1,019 words", "1,638 words", "1,815 words", "5,622 words"];
  for (const [i, words] of counts.entries()) {
    await expect(levels.nth(i)).toContainText(i === 6 ? "HSK 7–9" : `HSK ${i + 1}`);
    await expect(levels.nth(i)).toContainText(words);
  }
  await noOverflow(page);
  await axe(page);
});

test("language switch keeps the current page", async ({ page }) => {
  await page.goto("/en/hsk/2");
  await page.getByRole("button", { name: "ru", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/hsk\/2$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Подготовка к HSK 2");
});

test("level hub links to the four modules", async ({ page }) => {
  await page.goto("/en/hsk/1");
  for (const name of ["Lessons & grammar", "Listening", "Characters & pinyin", "Speaking & HSKK coach"]) {
    await expect(page.getByRole("link", { name: new RegExp(name.replace(/[&]/g, "\\&")) })).toBeVisible();
  }
  await noOverflow(page);
  await axe(page);
});

test("lesson word list shows hanzi, pinyin and Russian meanings", async ({ page }) => {
  await page.goto("/ru/hsk/1/lessons/1");
  const rows = page.locator('[role="tabpanel"] li');
  await expect(rows).toHaveCount(15);
  await expect(page.getByText("притяжательная частица")).toBeVisible();
  await noOverflow(page);
  await axe(page);
});

test("flashcards: reveal, rate, requeue and save progress", async ({ page }) => {
  await page.goto("/en/hsk/1/lessons/2");
  await page.getByRole("tab", { name: "Flashcards" }).click();
  await expect(page.getByTestId("remaining")).toHaveText("15 left");
  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.locator('[data-grade="good"]').click();
  await expect(page.getByTestId("remaining")).toHaveText("14 left");
  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.locator('[data-grade="again"]').click();
  await expect(page.getByTestId("remaining")).toHaveText("14 left");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hsk-master:progress:v1")!));
  expect(Object.keys(stored.words)).toHaveLength(2);
  await noOverflow(page);
  await axe(page);
  // keyboard path
  await page.keyboard.press("Space");
  await page.keyboard.press("4");
  await expect(page.getByTestId("remaining")).toHaveText("13 left");
});

test("lesson test scores answers and records the best result", async ({ page }) => {
  await page.goto("/en/hsk/1/lessons/3");
  await page.getByRole("tab", { name: "Test" }).click();
  for (let i = 0; i < 15; i++) {
    await page.locator('[data-option="0"]').click();
    await page.getByRole("button", { name: i === 14 ? /See results/ : /Next/ }).click();
  }
  await expect(page.getByTestId("test-result")).toHaveText(/\d+ out of 15/);
  await page.goto("/en/hsk/1/lessons");
  await expect(page.getByText(/Best test: \d+\/15/)).toBeVisible();
  await noOverflow(page);
});

test("grammar page has explained HSK 1 points and the official list", async ({ page }) => {
  await page.goto("/en/hsk/1/grammar");
  await expect(page.locator("article")).toHaveCount(14);
  await expect(page.getByRole("heading", { name: "Official grammar list" })).toBeVisible();
  await expect(page.getByText("70 items in the official list")).toBeVisible();
  await expect(page.getByText("Modal verbs").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yes/no questions with 吗" })).toBeVisible();
  await page.goto("/ru/hsk/1/grammar");
  await expect(page.getByRole("heading", { name: "Общий вопрос с 吗" })).toBeVisible();
  await noOverflow(page);
  await axe(page);
});

test("writing: stroke animation, stroke checking and saved result", async ({ page }) => {
  await page.goto("/en/hsk/1/writing");
  // pick 人 (2 strokes) from whichever lesson has it
  for (let l = 1; l <= 20; l++) {
    await page.selectOption("#lesson-select", String(l));
    if (await page.locator('[data-char="人"]').count()) break;
  }
  await page.locator('[data-char="人"]').click();
  await expect(page.getByText("2 strokes")).toBeVisible();
  await page.getByRole("button", { name: /Watch strokes/ }).click();
  await expect(page.getByTestId("writer-status")).toHaveText(/That's all 2 strokes/, { timeout: 15_000 });

  await page.getByRole("button", { name: /Write it/ }).click();
  const box = (await page.getByTestId("writer").boundingBox())!;
  const res = await page.request.get("/hanzi/4eba.json");
  const { medians } = await res.json();
  const pad = Math.round(box.width * 0.06);
  const scale = (box.width - 2 * pad) / 1024;
  const pt = ([x, y]: number[]) => [box.x + pad + x * scale, box.y + pad + (900 - y) * scale] as const;
  for (const median of medians as number[][][]) {
    await page.mouse.move(...pt(median[0]));
    await page.mouse.down();
    for (const p of median.slice(1)) await page.mouse.move(...pt(p), { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  await expect(page.getByTestId("writer-status")).toHaveText("Perfect: every stroke correct the first time.", { timeout: 5_000 });
  await expect(page.getByText("Best: no mistakes")).toBeVisible();
  await noOverflow(page);
  await axe(page);
});

test("tone drill gives feedback and keeps score", async ({ page }) => {
  await page.goto("/en/hsk/1/writing");
  const drill = page.getByTestId("tone-drill");
  await drill.locator('[data-tone="1"]').click();
  await expect(drill.getByRole("status")).toHaveText(/^(Correct|Incorrect)/);
  await expect(drill).toContainText("Score");
  await drill.getByRole("button", { name: "Next" }).click();
  await expect(drill.getByRole("status")).toHaveText("");
});

test("settings: dark theme, tone colours off, reset with confirmation", async ({ page }) => {
  await page.goto("/en/settings");
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await axe(page);
  await page.getByLabel("Colour syllables by tone").uncheck();
  await page.getByRole("button", { name: "Reset all progress" }).click();
  await page.getByRole("button", { name: "Yes, delete progress" }).click();
  await expect(page.getByText("Progress deleted.")).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("dark theme pages pass contrast checks", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  for (const path of ["/en", "/ru/hsk/3", "/en/hsk/1/lessons/1", "/en/hsk/2/writing", "/ru/hsk/1/listening"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await noOverflow(page);
    await axe(page);
  }
});

test("PWA manifest and service worker are served", async ({ page, request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.display).toBe("standalone");
  expect((await request.get("/sw.js")).ok()).toBe(true);
  await page.goto("/en");
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 10_000 }).toBe(true);
});

test("HSK 7–9 has its own hub, lessons and official grammar", async ({ page }) => {
  await page.goto("/en/hsk/7-9");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("HSK 7–9 preparation");
  await page.getByRole("link", { name: /Lessons & grammar/ }).click();
  await expect(page).toHaveURL(/\/en\/hsk\/7-9\/lessons$/);
  await expect(page.getByText("141 lessons").or(page.locator("main ol > li")).first()).toBeVisible();
  await page.goto("/ru/hsk/7-9/grammar");
  await expect(page.getByText("Пунктов в официальном списке: 134")).toBeVisible();
  await noOverflow(page);
  await axe(page);
});

test("syllabus spelling is shown for words like 没（有）", async ({ page }) => {
  for (let l = 1; l <= 20; l++) {
    await page.goto(`/en/hsk/1/lessons/${l}`);
    if (await page.getByText("Syllabus form: 没（有）").count()) return;
  }
  throw new Error("没（有） not found in HSK 1 lessons");
});

test("random practice: flashcard sets change every time and avoid recent words", async ({ page }) => {
  await page.goto("/en/hsk/1");
  await page.getByRole("link", { name: /Random practice/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("HSK 1 random practice");
  await page.getByText("Flashcards", { exact: true }).click();
  await page.getByText("10", { exact: true }).click();
  await page.getByText("Characters", { exact: true }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByTestId("remaining")).toHaveText("10 left");
  const firstSet = await page.evaluate(() => JSON.parse(localStorage.getItem("hsk-master:practice-recent:v1")!)["1"] as string[]);
  expect(firstSet).toHaveLength(10);
  await page.getByRole("button", { name: "New random set" }).click();
  await expect(page.getByTestId("remaining")).toHaveText("10 left");
  const both = await page.evaluate(() => JSON.parse(localStorage.getItem("hsk-master:practice-recent:v1")!)["1"] as string[]);
  expect(both).toHaveLength(20);
  expect(new Set(both).size, "second set repeats none of the first").toBe(20);
  await noOverflow(page);
  await axe(page);
});

test("random practice: meaning-first cards and a mixed-format test", async ({ page }) => {
  await page.goto("/ru/hsk/2/practice");
  await page.getByText("Значение", { exact: true }).click();
  await page.getByText("10", { exact: true }).click();
  await page.getByRole("button", { name: "Начать" }).click();
  await expect(page.getByText("Вспомните иероглифы и произношение")).toBeVisible();
  await page.getByRole("button", { name: "Изменить настройки" }).click();
  await page.getByText("Тест", { exact: true }).click();
  await page.getByRole("button", { name: "Начать" }).click();
  const asks = new Set<string>();
  for (let i = 0; i < 10; i++) {
    asks.add((await page.locator(".eyebrow").first().textContent())!.split("·")[1].trim());
    await page.keyboard.press("1");
    await page.keyboard.press("Enter");
  }
  await expect(page.getByTestId("test-result")).toContainText("из 10");
  expect(asks.size, `question types: ${[...asks].join(", ")}`).toBeGreaterThanOrEqual(3);
  await noOverflow(page);
  await axe(page);
});

test("random practice works for HSK 7–9 and filters by studied words", async ({ page }) => {
  await page.goto("/en/hsk/7-9/practice");
  await expect(page.getByText(/Whole level · 5,622/)).toBeVisible();
  await page.getByText(/Words I've studied · 0/).click();
  await expect(page.getByText(/No words match this choice yet/)).toBeVisible();
});
