import { AnimatePresence, motion } from "motion/react";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-[3%] right-[3%] z-50"
        >
          <div className="px-[1.5vw] py-[0.6vw] rounded-full bg-white/5 backdrop-blur-md border border-white/5">
            <span className="text-[0.8vw] text-white/50">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
