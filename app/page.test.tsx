import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

const RESULT = {
  title: "서버 컴포넌트 후기",
  author: "김하늘",
  markdown: "## 측정 환경\n\n- 페이지 142개",
};

let writeText: ReturnType<typeof vi.spyOn>;
let openSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  openSpy = vi.fn();
  vi.stubGlobal("open", openSpy);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(RESULT, { status: 200 }))
  );
});

afterEach(() => vi.unstubAllGlobals());

// userEvent.setup()이 navigator.clipboard를 자체 구현으로 바꾸므로 그 뒤에 감시한다.
function setupUser() {
  const user = userEvent.setup();
  writeText = vi.spyOn(navigator.clipboard, "writeText");
  return user;
}

async function convertSample(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText("웹 페이지 URL"),
    "https://example.dev/post"
  );
  await user.click(screen.getByRole("button", { name: "변환" }));
  await screen.findByRole("heading", { name: RESULT.title });
}

test("URL을 변환하면 제목·저자와 렌더링된 Markdown이 보이고, 지우기로 초기화된다", async () => {
  const user = setupUser();
  render(<Home />);
  expect(screen.getByText("변환할 페이지를 입력하세요")).toBeInTheDocument();

  await convertSample(user);

  expect(screen.getByText("김하늘")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: "측정 환경" })
  ).toBeInTheDocument();
  expect(screen.getByText("페이지 142개")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "지우기" }));
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("");
  expect(screen.getByText("변환할 페이지를 입력하세요")).toBeInTheDocument();
});

test("복사하기는 Markdown 원문을 클립보드에 넣는다", async () => {
  const user = setupUser();
  render(<Home />);
  await convertSample(user);

  await user.click(screen.getByRole("button", { name: "복사하기" }));

  expect(writeText).toHaveBeenCalledWith(RESULT.markdown);
  expect(await screen.findByText("복사했습니다")).toBeInTheDocument();
});

test("프리셋을 고르고 Claude로 열면 프롬프트+본문을 복사하고 새 탭을 연다", async () => {
  const user = setupUser();
  render(<Home />);
  await convertSample(user);

  await user.click(screen.getByRole("button", { name: "요약해줘" }));
  await user.click(screen.getByRole("button", { name: "Claude로 열기" }));

  expect(writeText).toHaveBeenCalledWith(`요약해줘\n\n${RESULT.markdown}`);
  expect(openSpy).toHaveBeenCalledWith(
    "https://claude.ai/new",
    "_blank",
    expect.any(String)
  );
  expect(await screen.findByText(/붙여넣기/)).toBeInTheDocument();
});

test("직접 입력을 고르기 전에는 입력란이 없고, 고르면 나타난다", async () => {
  const user = setupUser();
  render(<Home />);
  expect(screen.queryByLabelText("직접 입력 프롬프트")).toBeNull();

  await user.click(screen.getByRole("button", { name: "직접 입력" }));
  await user.type(screen.getByLabelText("직접 입력 프롬프트"), "세 줄로");
  await convertSample(user);
  await user.click(screen.getByRole("button", { name: "ChatGPT로 열기" }));

  expect(writeText).toHaveBeenCalledWith(`세 줄로\n\n${RESULT.markdown}`);
});

test("변환에 실패하면 오류를 보여 주고 입력은 유지한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json(
        { code: "fetch-failed", message: "해당 페이지를 가져오지 못했습니다." },
        { status: 422 }
      )
    )
  );
  const user = setupUser();
  render(<Home />);

  await user.type(screen.getByLabelText("웹 페이지 URL"), "https://x.dev/a");
  await user.click(screen.getByRole("button", { name: "변환" }));

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("가져오지 못했습니다")
  );
  expect(screen.getByLabelText("웹 페이지 URL")).toHaveValue("https://x.dev/a");
});
