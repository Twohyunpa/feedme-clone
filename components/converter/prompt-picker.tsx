"use client";

import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const PROMPT_PRESETS = [
  "요약해줘",
  "한국어로 번역해줘",
  "쉽게 설명해줘",
] as const;
export const CUSTOM_PROMPT = "custom";

const ITEM_CLASS =
  "aria-pressed:bg-primary aria-pressed:text-primary-foreground";

type PromptPickerProps = {
  selected: string | null;
  customText: string;
  onSelect: (value: string | null) => void;
  onCustomTextChange: (text: string) => void;
};

export function PromptPicker({
  selected,
  customText,
  onSelect,
  onCustomTextChange,
}: PromptPickerProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        프롬프트 (선택)
      </h2>
      <ToggleGroup
        variant="outline"
        spacing={2}
        className="flex-wrap"
        value={selected ? [selected] : []}
        onValueChange={(value) => onSelect(value[0] ?? null)}
        aria-label="프롬프트"
      >
        {PROMPT_PRESETS.map((preset) => (
          <ToggleGroupItem key={preset} value={preset} className={ITEM_CLASS}>
            {preset}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem value={CUSTOM_PROMPT} className={ITEM_CLASS}>
          직접 입력
        </ToggleGroupItem>
      </ToggleGroup>
      {selected === CUSTOM_PROMPT && (
        <div className="flex flex-col gap-1.5">
          <Textarea
            aria-label="직접 입력 프롬프트"
            placeholder="예: 핵심만 세 줄로 정리하고 반론도 알려줘"
            value={customText}
            onChange={(event) => onCustomTextChange(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            한 번만 사용되며 저장되지 않습니다.
          </p>
        </div>
      )}
    </section>
  );
}
