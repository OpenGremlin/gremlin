import type { AvatarState } from "@gremlin/shared-types";
import { motion } from "motion/react";

interface AvatarProps {
  state: AvatarState;
  size?: "main" | "mini";
  label?: string;
}

const stateGlow: Record<AvatarState, string> = {
  dormant: "rgba(80,70,60,0.2)",
  attentive: "rgba(120,160,255,0.18)",
  active: "rgba(180,140,255,0.22)",
  waiting: "rgba(255,180,80,0.18)",
};

export function Avatar({ state, size = "main", label }: AvatarProps) {
  const isMain = size === "main";

  return (
    <div className="flex flex-col items-center gap-[0.4vw]">
      <motion.div
        className={`${isMain ? "w-[80%]" : "w-[65%]"} aspect-square relative`}
        animate={{
          scale:
            state === "dormant"
              ? [1, 1.03, 1]
              : state === "attentive"
                ? [1, 1.05, 1]
                : [1, 1.08, 1],
        }}
        transition={{
          duration: state === "dormant" ? 4 : 2.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        {/* Spindly limbs — rendered behind body */}
        <Limbs state={state} />

        {/* Soot sprite body */}
        <SootBody state={state} />

        {/* Big white eyes — the signature feature */}
        <Eyes state={state} isMain={isMain} />
      </motion.div>
      {label && (
        <span className="text-[0.55vw] text-white/30 tracking-wider uppercase truncate max-w-full px-[0.2vw]">
          {label}
        </span>
      )}
    </div>
  );
}

function SootBody({ state }: { state: AvatarState }) {
  return (
    <>
      {/* Core soot ball — dark but visible against black bg */}
      <div
        className="absolute inset-[14%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 44% 40%, #52483e 0%, #3a3028 40%, #241e18 70%, #1a1510 100%)",
          boxShadow: `
            0 0 8px 4px rgba(0,0,0,0.5),
            0 0 20px 10px ${stateGlow[state]}
          `,
        }}
      />

      {/* Fuzzy sooty fringe — soft irregular edge */}
      <div
        className="absolute inset-[6%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, transparent 34%, rgba(50,42,34,0.45) 48%, rgba(35,28,22,0.2) 56%, transparent 64%)",
          filter: "blur(1.5px)",
        }}
      />

      {/* Outer sooty wisps */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, transparent 40%, rgba(40,34,28,0.15) 52%, transparent 60%)",
          filter: "blur(3px)",
        }}
      />
    </>
  );
}

const LIMBS = [
  // Bottom legs — the classic soot sprite feature
  { angle: 190, isLeg: true },
  { angle: 210, isLeg: true },
  { angle: 230, isLeg: true },
  { angle: 250, isLeg: true },
  { angle: 270, isLeg: true },
  { angle: 290, isLeg: true },
  { angle: 310, isLeg: true },
  { angle: 330, isLeg: true },
  { angle: 350, isLeg: true },
  // Top arms — shorter, wispier
  { angle: 15, isLeg: false },
  { angle: 50, isLeg: false },
  { angle: 80, isLeg: false },
  { angle: 100, isLeg: false },
  { angle: 130, isLeg: false },
  { angle: 165, isLeg: false },
] as const;

function Limbs({ state }: { state: AvatarState }) {
  return (
    <>
      {LIMBS.map((limb, i) => (
        <Limb
          key={`limb-${limb.angle}`}
          angle={limb.angle}
          state={state}
          isLeg={limb.isLeg}
          index={i}
        />
      ))}
    </>
  );
}

function Limb({
  angle,
  state,
  isLeg,
  index,
}: {
  angle: number;
  state: AvatarState;
  isLeg: boolean;
  index: number;
}) {
  const length = isLeg ? "26%" : "18%";
  const delay = index * 0.1;
  const rad = (angle * Math.PI) / 180;

  const edgeRadius = 36;
  const startX = 50 + edgeRadius * Math.cos(rad);
  const startY = 50 + edgeRadius * Math.sin(rad);

  return (
    <motion.div
      className="absolute"
      style={{
        width: length,
        height: isLeg ? "2.5px" : "2px",
        left: `${startX}%`,
        top: `${startY}%`,
        background: isLeg
          ? "linear-gradient(to right, rgba(70,58,48,0.95), rgba(50,42,34,0.6), rgba(30,26,22,0.05))"
          : "linear-gradient(to right, rgba(60,50,40,0.8), rgba(40,34,28,0.15))",
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0% 50%",
        borderRadius: "1px",
      }}
      animate={{
        rotate:
          state === "dormant"
            ? [angle - 3, angle + 3, angle - 3]
            : state === "active"
              ? [angle - 8, angle + 8, angle - 8]
              : [angle - 5, angle + 5, angle - 5],
      }}
      transition={{
        duration: state === "dormant" ? 2.5 : 1.2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function Eyes({ state, isMain }: { state: AvatarState; isMain: boolean }) {
  // Susuwatari have BIG round white eyes close together
  const eyeSize = isMain ? "21%" : "19%";
  const pupilSize = isMain ? "8%" : "7%";
  const gap = isMain ? "6%" : "4%";

  const eyeScaleY =
    state === "dormant" ? 0.9 : state === "waiting" ? 0.95 : 1;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ paddingBottom: "4%" }}
    >
      <div className="flex items-center" style={{ gap }}>
        <Eye
          size={eyeSize}
          pupilSize={pupilSize}
          scaleY={eyeScaleY}
          state={state}
          side="left"
        />
        <Eye
          size={eyeSize}
          pupilSize={pupilSize}
          scaleY={eyeScaleY}
          state={state}
          side="right"
        />
      </div>
    </div>
  );
}

function Eye({
  size,
  pupilSize,
  scaleY,
  state,
  side,
}: {
  size: string;
  pupilSize: string;
  scaleY: number;
  state: AvatarState;
  side: "left" | "right";
}) {
  const pupilX =
    state === "waiting" ? (side === "left" ? "55%" : "55%") : "50%";
  const pupilY = state === "attentive" ? "45%" : "50%";

  return (
    <motion.div
      className="relative rounded-full"
      style={{
        width: size,
        paddingBottom: size,
        background:
          "radial-gradient(circle at 45% 42%, #ffffff 0%, #ffffff 40%, #f0ede6 70%, #ddd8cc 100%)",
        boxShadow:
          "0 0 8px 3px rgba(255,255,255,0.4), 0 0 3px 1px rgba(255,255,255,0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      animate={{
        scaleY: [scaleY, scaleY, 0.05, scaleY, scaleY],
      }}
      transition={{
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        times: [0, 0.85, 0.88, 0.91, 1],
        delay: side === "right" ? 0.05 : 0,
      }}
    >
      {/* Pupil */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: pupilSize,
          height: pupilSize,
          top: pupilY,
          left: pupilX,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, #0c0a06 0%, #201a12 80%)",
        }}
        animate={
          state === "waiting"
            ? { left: ["45%", "55%", "55%", "45%", "45%"] }
            : undefined
        }
        transition={
          state === "waiting"
            ? {
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
            : undefined
        }
      />
    </motion.div>
  );
}
