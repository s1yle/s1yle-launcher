import { motion, AnimatePresence, scale } from "framer-motion";
import type { ReactNode } from "react";
import type { LoginView } from "../hooks/useLoginFlow";

interface ViewContainerProps {
  view: LoginView;
  children: ReactNode;
}

const slideVariants = {
  initial: { opacity: 0, scale: 0.95},
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1 },
};

export function ViewContainer({ view, children }: ViewContainerProps) {
  return (
    <div 
      className="w-screen h-full overflow-hidden
        transition-all duration-1000 ease-in-out
        flex
        justify-center items-center
        px-4
    ">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: 0.2, type: 'spring' 
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
