import { ChevronDown, ChevronUp } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

export function ExpandablePlainText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;

    const update = () => {
      const current = textRef.current;
      if (!current) return;
      setOverflowing(
        current.clientHeight > 0 && current.scrollHeight > current.clientHeight + 1,
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  const showToggle = overflowing || expanded;

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="w-full min-w-0 overflow-hidden">
        <p
          ref={textRef}
          className={
            expanded
              ? "text-xs text-gray-600 whitespace-pre-wrap break-words leading-relaxed text-left"
              : "text-xs text-gray-600 line-clamp-2 break-words leading-relaxed text-left"
          }
        >
          {text}
        </p>
      </div>
      {showToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          className="w-full flex items-center justify-center gap-1.5 rounded-full border border-gray-200/80 bg-transparent px-4 py-2.5 text-xs font-medium text-gray-800 outline-none transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Show less" : "Show more"}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}
