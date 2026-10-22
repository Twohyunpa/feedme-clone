import { expect, test } from "vitest";

import { composeLlmText, markdownFileName } from "@/lib/export/export-text";

test("프롬프트가 있으면 빈 줄을 두고 본문 앞에 붙인다", () => {
  expect(composeLlmText("요약해줘", "# 글")).toBe("요약해줘\n\n# 글");
});

test("프롬프트가 비어 있으면 본문만 전달한다", () => {
  expect(composeLlmText("", "# 글")).toBe("# 글");
  expect(composeLlmText("   ", "# 글")).toBe("# 글");
});

test("파일명은 제목에서 금지 문자를 빼고 .md를 붙인다", () => {
  expect(markdownFileName('서버: 컴포넌트/후기?')).toBe("서버 컴포넌트후기.md");
  expect(markdownFileName("   ")).toBe("page.md");
});
