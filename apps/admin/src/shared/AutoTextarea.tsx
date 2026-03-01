import { type ComponentProps, useCallback, useEffect, useRef } from "react";

type AutoTextareaProps = ComponentProps<"textarea"> & {
  /** Minimum number of visible rows (default 3) */
  minRows?: number;
};

export function AutoTextarea({ minRows = 3, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 0)}px`;
  }, []);

  const value = props.value ?? props.defaultValue;

  useEffect(() => {
    // value is intentionally in the dep list to trigger resize on external changes
    void value;
    resize();
  }, [value, resize]);

  return (
    <textarea
      {...props}
      ref={(el) => {
        ref.current = el;
        // Forward external ref (e.g. from react-hook-form register)
        const { ref: externalRef } = props as {
          ref?: React.Ref<HTMLTextAreaElement>;
        };
        if (typeof externalRef === "function") externalRef(el);
        else if (externalRef)
          (
            externalRef as React.MutableRefObject<HTMLTextAreaElement | null>
          ).current = el;
      }}
      rows={minRows}
      onChange={(e) => {
        props.onChange?.(e);
        resize();
      }}
      style={{ ...props.style, overflow: "hidden", resize: "none" }}
    />
  );
}
