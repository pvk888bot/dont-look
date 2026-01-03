import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md p-12 text-center border border-primary/20 bg-background aspect-square relative">
        <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-7xl font-bold mb-12 text-vedome-green distressed-title tracking-widest select-none"
        >
            DON'T<br/>LOOK
        </motion.h1>

        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={() => setLocation("/game")}
            className="px-8 py-3 text-sm tracking-[0.2em] text-white bg-primary hover:bg-primary/90 transition-colors uppercase cursor-pointer"
        >
            Play
        </motion.button>
    </div>
  );
}
