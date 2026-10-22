"use client";

import { ContrastIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // 저장하지 못해도 현재 화면에는 적용된다.
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="다크모드 전환"
      title="다크모드 전환"
      onClick={toggle}
    >
      <ContrastIcon />
    </Button>
  );
}
