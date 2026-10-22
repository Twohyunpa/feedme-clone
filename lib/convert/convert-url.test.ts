import { describe, expect, test } from "vitest";

import { ConvertError, convertUrl } from "@/lib/convert/convert-url";

const ARTICLE = `<!doctype html><html><head><title>서버 컴포넌트 후기</title>
<meta name="author" content="김하늘"></head><body>
<nav>메뉴 홈 소개</nav>
<article><h1>서버 컴포넌트 후기</h1>
<p>${"초기 JS가 38% 줄었지만 팀이 체감한 이득은 달랐습니다. ".repeat(12)}</p>
<h2>측정 환경</h2><ul><li>페이지 142개</li><li>Lighthouse 모바일</li></ul></article>
</body></html>`;

const htmlResponse = (body: string, status = 200) =>
  Promise.resolve(
    new Response(body, { status, headers: { "content-type": "text/html" } })
  );

describe("convertUrl", () => {
  test("본문을 Markdown으로 바꾸고 제목과 저자를 돌려준다", async () => {
    const result = await convertUrl("https://example.dev/post", () =>
      htmlResponse(ARTICLE)
    );

    expect(result.title).toBe("서버 컴포넌트 후기");
    expect(result.author).toBe("김하늘");
    expect(result.markdown).toContain("## 측정 환경");
    expect(result.markdown).toContain("- 페이지 142개");
  });

  test("http/https가 아닌 주소는 invalid-url로 거절한다", async () => {
    await expect(
      convertUrl("ftp://example.dev/a", () => htmlResponse(ARTICLE))
    ).rejects.toMatchObject({ code: "invalid-url" });
    await expect(
      convertUrl("not a url", () => htmlResponse(ARTICLE))
    ).rejects.toBeInstanceOf(ConvertError);
  });

  test("페이지를 가져오지 못하면 fetch-failed", async () => {
    await expect(
      convertUrl("https://example.dev/x", () => htmlResponse("no", 403))
    ).rejects.toMatchObject({ code: "fetch-failed" });
    await expect(
      convertUrl("https://example.dev/x", () => Promise.reject(new Error("net")))
    ).rejects.toMatchObject({ code: "fetch-failed" });
  });

  test("본문이 비어 있으면 extract-failed", async () => {
    await expect(
      convertUrl("https://example.dev/x", () =>
        htmlResponse("<html><body></body></html>")
      )
    ).rejects.toMatchObject({ code: "extract-failed" });
  });
});
