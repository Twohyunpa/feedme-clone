import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 URL 입력란과 프롬프트 프리셋이 보인다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("URL → Markdown");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "URL → Markdown"
  );
  await expect(page.getByLabel("웹 페이지 URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "요약해줘" })).toBeVisible();
});
