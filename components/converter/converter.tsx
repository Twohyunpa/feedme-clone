"use client";

import { useRef, useState } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";

import { MarkdownView } from "@/components/converter/markdown-view";
import {
  CUSTOM_PROMPT,
  PromptPicker,
} from "@/components/converter/prompt-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConvertResult } from "@/lib/convert/convert-url";
import { composeLlmText, markdownFileName } from "@/lib/export/export-text";

type Phase =
  | { name: "idle" }
  | { name: "loading" }
  | { name: "error"; message: string }
  | { name: "result"; result: ConvertResult };

type Notice = { title: string; message: string };

const LLM_TARGETS = [
  { label: "ChatGPT", url: "https://chatgpt.com/" },
  { label: "Claude", url: "https://claude.ai/new" },
] as const;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function Converter() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [promptChoice, setPromptChoice] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  // 지우기 이후에 늦게 도착한 응답을 버리기 위한 요청 번호
  const requestId = useRef(0);

  const promptText =
    promptChoice === CUSTOM_PROMPT ? customPrompt : (promptChoice ?? "");

  async function convert(event: React.FormEvent) {
    event.preventDefault();
    setNotice(null);
    setPhase({ name: "loading" });
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (id !== requestId.current) return;
      setPhase(
        response.ok
          ? { name: "result", result: data }
          : { name: "error", message: data.message }
      );
    } catch {
      if (id !== requestId.current) return;
      setPhase({
        name: "error",
        message: "서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  function reset() {
    requestId.current++;
    setUrl("");
    setPhase({ name: "idle" });
    setPromptChoice(null);
    setCustomPrompt("");
    setNotice(null);
  }

  async function copyMarkdown(markdown: string) {
    const ok = await copyToClipboard(markdown);
    setNotice(
      ok
        ? {
            title: "복사했습니다",
            message: "Markdown 원문이 클립보드에 있습니다.",
          }
        : {
            title: "복사하지 못했습니다",
            message: "브라우저가 클립보드 접근을 막았습니다.",
          }
    );
  }

  function download(result: ConvertResult) {
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = markdownFileName(result.title);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function openInLlm(
    target: (typeof LLM_TARGETS)[number],
    markdown: string
  ) {
    // 클릭 직후에 탭을 먼저 열어 팝업 차단을 피한다.
    window.open(target.url, "_blank", "noopener,noreferrer");
    const ok = await copyToClipboard(composeLlmText(promptText, markdown));
    const withPrompt = promptText.trim()
      ? " 프롬프트가 본문 앞에 붙어 있습니다."
      : "";
    setNotice(
      ok
        ? {
            title: "클립보드에 복사했습니다",
            message: `${target.label} 새 대화에 붙여넣기(Ctrl+V)하세요.${withPrompt}`,
          }
        : {
            title: "복사하지 못했습니다",
            message: `${target.label} 탭은 열렸지만 클립보드 접근이 막혔습니다. 복사하기를 눌러 직접 붙여넣어 주세요.`,
          }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={convert} noValidate>
        <InputGroup>
          <InputGroupInput
            type="url"
            aria-label="웹 페이지 URL"
            placeholder="https://example.com/article"
            autoComplete="off"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {url && (
              <InputGroupButton
                size="icon-xs"
                aria-label="지우기"
                onClick={reset}
              >
                <XIcon />
              </InputGroupButton>
            )}
            <InputGroupButton
              type="submit"
              size="icon-xs"
              variant="default"
              aria-label="변환"
              disabled={phase.name === "loading"}
            >
              <ArrowRightIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <PromptPicker
        selected={promptChoice}
        customText={customPrompt}
        onSelect={setPromptChoice}
        onCustomTextChange={setCustomPrompt}
      />

      {phase.name === "idle" && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>변환할 페이지를 입력하세요</EmptyTitle>
            <EmptyDescription>
              뉴스 기사, 블로그 글, 문서 페이지 주소를 붙여넣으면 여기에 본문이
              나타납니다.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {phase.name === "loading" && (
        <Card role="status" aria-label="변환 중">
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mb-4 h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/5" />
          </CardContent>
        </Card>
      )}

      {phase.name === "error" && (
        <Alert variant="destructive">
          <AlertTitle>본문을 가져오지 못했습니다</AlertTitle>
          <AlertDescription>{phase.message}</AlertDescription>
        </Alert>
      )}

      {phase.name === "result" && (
        <>
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-xl leading-snug">
                <h2>{phase.result.title}</h2>
              </CardTitle>
              {phase.result.author && (
                <p className="text-sm text-muted-foreground">
                  {phase.result.author}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <MarkdownView markdown={phase.result.markdown} />
            </CardContent>
          </Card>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              내보내기
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => copyMarkdown(phase.result.markdown)}
              >
                복사하기
              </Button>
              <Button variant="outline" onClick={() => download(phase.result)}>
                .md 다운로드
              </Button>
              <span className="hidden flex-1 sm:block" />
              {LLM_TARGETS.map((target) => (
                <Button
                  key={target.label}
                  onClick={() => openInLlm(target, phase.result.markdown)}
                >
                  {target.label}로 열기
                </Button>
              ))}
            </div>
          </section>

          {notice && (
            <Alert role="status">
              <AlertTitle>{notice.title}</AlertTitle>
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
