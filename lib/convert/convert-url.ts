import { Defuddle } from "defuddle/node";
import { parseHTML } from "linkedom";

export type ConvertErrorCode =
  | "invalid-url"
  | "fetch-failed"
  | "extract-failed";

export class ConvertError extends Error {
  constructor(
    readonly code: ConvertErrorCode,
    message: string
  ) {
    super(message);
  }
}

export type ConvertResult = {
  title: string;
  author: string;
  markdown: string;
};

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function convertUrl(
  rawUrl: string,
  fetcher: Fetcher = fetch
): Promise<ConvertResult> {
  const url = parseHttpUrl(rawUrl);

  let html: string;
  try {
    const response = await fetcher(url.href, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; UrlToMarkdown/1.0)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch {
    throw new ConvertError(
      "fetch-failed",
      "해당 페이지를 가져오지 못했습니다. 주소를 확인하거나 다른 페이지로 시도해 보세요."
    );
  }

  const { document } = parseHTML(html);
  const extracted = await Defuddle(document, url.href, { markdown: true });
  const markdown = extracted.content?.trim() ?? "";
  if (!markdown) {
    throw new ConvertError(
      "extract-failed",
      "페이지에서 본문을 찾지 못했습니다. 로그인이 필요하거나 자바스크립트로 그려지는 페이지일 수 있습니다."
    );
  }

  return {
    title: extracted.title?.trim() || url.hostname,
    author: extracted.author?.trim() ?? "",
    markdown,
  };
}

function parseHttpUrl(rawUrl: string): URL {
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol === "http:" || url.protocol === "https:") return url;
  } catch {
    // 아래에서 같은 오류로 처리한다.
  }
  throw new ConvertError(
    "invalid-url",
    "http:// 또는 https://로 시작하는 올바른 주소를 입력하세요."
  );
}
