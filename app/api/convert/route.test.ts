import { afterEach, expect, test, vi } from "vitest";

import { POST } from "@/app/api/convert/route";

afterEach(() => vi.unstubAllGlobals());

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/convert", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

test("올바른 URL이면 제목·저자·Markdown을 JSON으로 돌려준다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        `<html><head><title>제목</title><meta name="author" content="저자"></head>
         <body><article><h1>제목</h1><p>${"본문 문장입니다. ".repeat(40)}</p></article></body></html>`
      )
    )
  );

  const response = await post({ url: "https://example.dev/a" });
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data).toMatchObject({ title: "제목", author: "저자" });
  expect(data.markdown).toContain("본문 문장입니다.");
});

test("잘못된 URL은 400과 오류 코드를 돌려준다", async () => {
  const response = await post({ url: "abc" });

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: "invalid-url" });
});

test("가져오기에 실패하면 422와 fetch-failed를 돌려준다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("x", { status: 403 })));

  const response = await post({ url: "https://blocked.example.com/a" });

  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ code: "fetch-failed" });
});
