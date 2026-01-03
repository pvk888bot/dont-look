import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound, LEVELS, type SoundLevel } from "@/lib/audio";
import { useLocation } from "wouter";

const WRONG_FEEDBACK = [
  "No.",
  "Try again.",
  "Is that what you heard?",
  "Cold.",
  "Not even close.",
  "Don't guess, listen.",
  "Silence is better than that answer.",
  "Keep trying.",
  "Incorrect.",
  "Focus."
];

export default function Game() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"neutral" | "success" | "error">("neutral");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentLevel = LEVELS[levelIndex];

  // Reset state when level changes
  useEffect(() => {
    setInputValue("");
    setFeedback(null);
    setFeedbackType("neutral");
    // Auto-focus input on level load? Maybe not, let user choose play first.
  }, [levelIndex]);

  const handlePlaySound = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setFeedback("Listening...");
    setFeedbackType("neutral");
    
    try {
      await playSound(currentLevel);
    } catch (e) {
      console.error("Audio error", e);
    } finally {
      setIsPlaying(false);
      setFeedback(null);
      // Focus input after sound ends
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const checkAnswer = () => {
    if (!inputValue.trim()) return;

    const guess = inputValue.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    const isCorrect = currentLevel.answers.some(a => a.toLowerCase() === guess);

    if (isCorrect) {
      setFeedbackType("success");
      setFeedback("Correct.");
      
      // Delay before next level
      setTimeout(() => {
        if (levelIndex < LEVELS.length - 1) {
            setLevelIndex(prev => prev + 1);
        } else {
            // End of game
            setFeedback("Complete.");
            setTimeout(() => setLocation("/"), 2000);
        }
      }, 1000);
    } else {
      setFeedbackType("error");
      const randomMsg = WRONG_FEEDBACK[Math.floor(Math.random() * WRONG_FEEDBACK.length)];
      setFeedback(randomMsg);
      // Shake animation trigger could go here
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkAnswer();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full max-w-md p-12 text-center border border-primary/20 bg-background aspect-square relative transition-colors duration-500 ${feedbackType === 'success' ? 'bg-[#008F28]/10' : ''}`}>
      
      {/* Background Flash for Success */}
      <AnimatePresence>
        {feedbackType === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#008F28] z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="z-10 w-full flex flex-col items-center gap-8">
        <button
            onClick={handlePlaySound}
            disabled={isPlaying}
            className={`px-6 py-2 text-xs tracking-[0.15em] uppercase border border-primary transition-all
                ${isPlaying 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-primary hover:text-white cursor-pointer"
                }
            `}
        >
            {isPlaying ? "Playing..." : "Play sound"}
        </button>

        <div className="w-full relative group">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type what you heard"
                className="w-full text-center bg-white py-3 px-4 text-sm font-mono border border-gray-300 focus:border-primary focus:outline-none transition-colors placeholder:text-gray-400 placeholder:text-xs placeholder:tracking-wide"
                autoComplete="off"
            />
            
            {/* Minimalist Feedback Line */}
            <div className="h-6 mt-2 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {feedback && (
                        <motion.span
                            key={feedback}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`text-xs tracking-wide ${
                                feedbackType === 'error' ? 'text-gray-500' : 
                                feedbackType === 'success' ? 'text-[#008F28] font-bold' : 
                                'text-gray-400'
                            }`}
                        >
                            {feedback}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>

        <button
            onClick={checkAnswer}
            className="px-8 py-2 text-xs tracking-[0.15em] text-white bg-primary hover:bg-primary/90 transition-colors uppercase cursor-pointer"
        >
            Submit
        </button>
      </div>

        {/* Level Indicator (Optional/Subtle) */}
        <div className="absolute bottom-4 text-[10px] text-gray-400 tracking-widest opacity-50">
            LEVEL {levelIndex + 1} / {LEVELS.length}
        </div>
    </div>
  );
}
