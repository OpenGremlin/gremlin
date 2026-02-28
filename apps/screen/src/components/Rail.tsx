import { AnimatePresence, motion } from "motion/react";

interface Task {
  id: string;
  label: string;
  imageUrl: string;
}

interface RailProps {
  avatarImageUrl: string;
  tasks: Task[];
}

export function Rail({ avatarImageUrl, tasks }: RailProps) {
  return (
    <div className="flex flex-col items-center w-[8%] min-w-[8%] h-full py-[2%] gap-[1.5vw]">
      {/* Subtle rail border */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />

      {/* Main avatar */}
      <img
        src={avatarImageUrl}
        alt="Avatar"
        className="w-[80%] aspect-square rounded-full object-cover"
      />

      {/* Divider */}
      {tasks.length > 0 && <div className="w-[40%] h-px bg-white/5" />}

      {/* Task mini avatars */}
      <div className="flex flex-col items-center gap-[1vw] overflow-hidden flex-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-[0.4vw]"
            >
              <img
                src={task.imageUrl}
                alt={task.label}
                className="w-[65%] aspect-square rounded-full object-cover"
              />
              <span className="text-[0.55vw] text-white/30 tracking-wider uppercase truncate max-w-full px-[0.2vw]">
                {task.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export type { Task };
