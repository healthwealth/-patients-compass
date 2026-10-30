import React from "react";
import { useInView } from "@/hooks/useInView";

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "left" | "right" | "fade";
  id?: string;
}

/**
 * Wraps a section and fades/slides it into view when it enters the viewport.
 * Respects prefers-reduced-motion (handled in useInView).
 */
export function RevealSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  id,
}: RevealSectionProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const baseTransition = `opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms, transform 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`;

  // On phones a sideways start position pokes past the screen edge and lets the
  // whole page wobble left and right, so narrow screens slide up instead.
  const isNarrow = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  const hiddenTransform = {
    up: "translateY(32px)",
    left: isNarrow ? "translateY(32px)" : "translateX(-32px)",
    right: isNarrow ? "translateY(32px)" : "translateX(32px)",
    fade: "none",
  }[direction];

  const style: React.CSSProperties = {
    transition: baseTransition,
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : hiddenTransform,
  };

  return (
    <div ref={ref} id={id} className={className} style={style}>
      {children}
    </div>
  );
}
