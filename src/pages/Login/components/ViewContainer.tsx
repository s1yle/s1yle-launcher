import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import type { LoginView } from "../LoginGate";
import { modalOpen } from "@/utils/animations";

interface ViewContainerProps {
  view: LoginView;
  children: ReactNode;
}

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
          variants={modalOpen}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
