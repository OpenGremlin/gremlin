import { FileText, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useDocumentUpdates } from "../subscriptions";

type Document = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  createdAt?: string;
};

function DocumentModal({
  doc,
  onClose,
}: {
  doc: Document;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const isScrolledToTop = () =>
    !bodyRef.current || bodyRef.current.scrollTop <= 0;

  const applyDrag = (clientY: number) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (!isScrolledToTop()) return;
    const dy = clientY - startY.current;
    if (dy > 0) {
      dragging.current = true;
      currentY.current = dy;
      sheet.style.transform = `translateY(${dy}px)`;
      sheet.style.transition = "none";
    }
  };

  const endDrag = () => {
    const sheet = sheetRef.current;
    if (!sheet || !dragging.current) {
      dragging.current = false;
      return;
    }
    if (currentY.current > 120) {
      onClose();
    } else {
      sheet.style.transform = "translateY(0)";
      sheet.style.transition = "transform 0.2s ease-out";
    }
    currentY.current = 0;
    dragging.current = false;
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) =>
    applyDrag(e.touches[0].clientY);
  const handleTouchEnd = () => endDrag();

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    const handleMouseMove = (ev: MouseEvent) => applyDrag(ev.clientY);
    const handleMouseUp = () => {
      endDrag();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative mt-12 flex-1 flex flex-col bg-neutral-900 rounded-t-2xl overflow-hidden transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle + header (drag zone) */}
        <div
          className="shrink-0 px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 rounded-full bg-neutral-700 mx-auto mb-3" />
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-indigo-400 shrink-0" />
            <h2 className="text-base font-semibold text-neutral-100 flex-1 truncate">
              {doc.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-neutral-500 hover:text-neutral-300 transition-colors p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-800/60" />

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-[60px] py-4">
          <div className="max-w-prose document-body text-sm text-neutral-300">
            <Markdown>{doc.body}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentCard({ doc: initial }: { doc: Document }) {
  const [doc, setDoc] = useState(initial);
  const [open, setOpen] = useState(false);

  // Live-update document content
  useDocumentUpdates(
    doc.id,
    useCallback((data) => {
      setDoc((prev) => ({ ...prev, ...data }));
    }, []),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer w-full text-left bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <FileText size={14} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-medium text-neutral-200 flex-1 truncate">
            {doc.title}
          </span>
        </div>
        <div className="border-t border-neutral-800/60" />
        <div className="relative px-3 py-2 max-h-36 overflow-hidden">
          <div className="document-body text-xs text-neutral-500">
            <Markdown>{doc.body}</Markdown>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-neutral-900 to-transparent" />
        </div>
      </button>

      {open && <DocumentModal doc={doc} onClose={() => setOpen(false)} />}
    </>
  );
}
