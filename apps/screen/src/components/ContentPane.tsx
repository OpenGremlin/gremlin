import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

type ContentLayout = "single" | "split";

interface ContentPaneProps {
  layout: ContentLayout;
  primary: ReactNode;
  secondary?: ReactNode;
}

export function ContentPane({ layout, primary, secondary }: ContentPaneProps) {
  return (
    <div className="flex-1 h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {layout === "single" ? (
          <motion.div
            key="single"
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {primary}
          </motion.div>
        ) : (
          <motion.div
            key="split"
            className="h-full w-full flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-1/2 h-full border-r border-white/5">
              {primary}
            </div>
            <div className="w-1/2 h-full">{secondary}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { ContentLayout };
