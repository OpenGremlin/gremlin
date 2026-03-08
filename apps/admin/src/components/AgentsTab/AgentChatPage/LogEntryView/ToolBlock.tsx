import { ArrowDownFromLine, ArrowUpFromLine, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "../../../../shared/formatDate";

function ScrolledPre({
  ref: externalRef,
  children,
  className,
  style,
}: {
  ref?: React.Ref<HTMLPreElement>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const innerRef = useRef<HTMLPreElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const updateEdges = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    );
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: style triggers shadow recompute on expand/collapse
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    updateEdges();
  }, [updateEdges, style]);

  const mergedRef = useCallback(
    (el: HTMLPreElement | null) => {
      (innerRef as React.MutableRefObject<HTMLPreElement | null>).current = el;
      if (typeof externalRef === "function") externalRef(el);
      else if (externalRef)
        (externalRef as React.MutableRefObject<HTMLPreElement | null>).current =
          el;
    },
    [externalRef],
  );

  return (
    <div className="relative">
      {edges.top && (
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-neutral-950/80 to-transparent pointer-events-none z-[1] rounded-t-lg" />
      )}
      {edges.bottom && (
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-neutral-950/80 to-transparent pointer-events-none z-[1] rounded-b-lg" />
      )}
      <pre
        ref={mergedRef}
        className={className}
        style={style}
        onScroll={updateEdges}
      >
        {children}
      </pre>
    </div>
  );
}

const BODY_MAX_HEIGHT = `${3 * 1.5 + 1}em`;

export function ToolBlock({
  id,
  label,
  content,
  createdAt,
  textClass = "text-green-400/90",
  defaultOpen = true,
  showTimestamp = true,
  badges,
  children,
}: {
  id: string;
  label: React.ReactNode;
  content?: string;
  createdAt: string;
  textClass?: string;
  defaultOpen?: boolean;
  showTimestamp?: boolean;
  badges?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const preRef = useCallback((el: HTMLPreElement | null) => {
    if (el) setOverflows(el.scrollHeight > el.clientHeight);
  }, []);

  return (
    <div id={id} className="py-1">
      <details className="group" open={defaultOpen || undefined}>
        <summary className="list-none cursor-pointer">
          <div className="flex items-start gap-1.5 py-1">
            <ChevronRight
              size={12}
              className="text-neutral-300 shrink-0 transition-transform group-open:rotate-90"
            />
            <span className="text-[11px] text-neutral-300 font-bold font-mono">
              {label}
            </span>
            {badges}
            {showTimestamp && (
              <span className="text-[10px] text-neutral-600 shrink-0">
                {formatTime(createdAt)}
              </span>
            )}
          </div>
        </summary>
        {children ?? (
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-lg mb-1">
            {(overflows || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="absolute top-1.5 right-1.5 p-0.5 text-neutral-600 hover:text-neutral-300 transition-colors z-[2]"
              >
                {expanded ? (
                  <ArrowUpFromLine size={14} />
                ) : (
                  <ArrowDownFromLine size={14} />
                )}
              </button>
            )}
            <ScrolledPre
              ref={preRef}
              className={`text-xs font-mono px-3 py-2 whitespace-pre-wrap leading-relaxed overflow-y-auto ${textClass}`}
              style={expanded ? undefined : { maxHeight: BODY_MAX_HEIGHT }}
            >
              {content}
            </ScrolledPre>
          </div>
        )}
      </details>
    </div>
  );
}
