import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated Bunny Avatar with lip-sync and expressions
 * @param {Object} props
 * @param {boolean} props.isSpeaking - Whether the avatar is currently speaking
 * @param {boolean} props.isThinking - Whether the avatar is thinking/loading
 * @param {boolean} props.isListening - Whether listening for voice input
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 */
export default function BunnyAvatar({
  isSpeaking = false,
  isThinking = false,
  isListening = false,
  size = "md",
  className,
}) {
  const [mouthState, setMouthState] = useState("closed"); // closed, small, medium, wide
  const [blinkState, setBlinkState] = useState(false);

  // Mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthState("closed");
      return;
    }

    const mouthStates = ["closed", "small", "medium", "wide", "medium", "small"];
    let index = 0;

    const interval = setInterval(() => {
      setMouthState(mouthStates[index]);
      index = (index + 1) % mouthStates.length;
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Natural blinking
  useEffect(() => {
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    };

    // Blink every 2-5 seconds
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      return setTimeout(() => {
        blink();
        scheduleBlink();
      }, delay);
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Size configurations
  const sizes = {
    sm: { container: "w-10 h-10", viewBox: "0 0 64 64" },
    md: { container: "w-16 h-16", viewBox: "0 0 64 64" },
    lg: { container: "w-24 h-24", viewBox: "0 0 64 64" },
    xl: { container: "w-32 h-32", viewBox: "0 0 64 64" },
  };

  const sizeConfig = sizes[size] || sizes.md;

  // Mouth shapes based on state
  const mouthPaths = {
    closed: "M 32 40 Q 28 41 26 40 M 32 40 Q 36 41 38 40",
    small: "M 26 40 Q 32 42 38 40",
    medium: "M 26 39 Q 32 44 38 39",
    wide: "M 26 38 Q 32 46 38 38",
  };

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-[#4A7C23] to-[#2D5016] flex items-center justify-center",
        sizeConfig.container,
        className
      )}
    >
      <svg
        viewBox={sizeConfig.viewBox}
        className="w-full h-full"
        fill="currentColor"
      >
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="bunnyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f5f4" />
            <stop offset="100%" stopColor="#e7e5e4" />
          </linearGradient>
          <linearGradient id="earInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>

        {/* Left ear */}
        <motion.g
          animate={isSpeaking ? { rotate: [0, -3, 0, 3, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          style={{ transformOrigin: "22px 30px" }}
        >
          <ellipse
            cx="22"
            cy="16"
            rx="5"
            ry="14"
            transform="rotate(-15 22 16)"
            fill="url(#bunnyGradient)"
          />
          <ellipse
            cx="22"
            cy="16"
            rx="2.5"
            ry="10"
            transform="rotate(-15 22 16)"
            fill="url(#earInner)"
          />
        </motion.g>

        {/* Right ear */}
        <motion.g
          animate={isSpeaking ? { rotate: [0, 3, 0, -3, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0, delay: 0.1 }}
          style={{ transformOrigin: "42px 30px" }}
        >
          <ellipse
            cx="42"
            cy="16"
            rx="5"
            ry="14"
            transform="rotate(15 42 16)"
            fill="url(#bunnyGradient)"
          />
          <ellipse
            cx="42"
            cy="16"
            rx="2.5"
            ry="10"
            transform="rotate(15 42 16)"
            fill="url(#earInner)"
          />
        </motion.g>

        {/* Head */}
        <circle cx="32" cy="36" r="18" fill="url(#bunnyGradient)" />

        {/* Cheeks */}
        <ellipse cx="20" cy="38" rx="4" ry="3" fill="#fecaca" opacity="0.6" />
        <ellipse cx="44" cy="38" rx="4" ry="3" fill="#fecaca" opacity="0.6" />

        {/* Left eye */}
        <motion.g animate={blinkState ? { scaleY: 0.1 } : { scaleY: 1 }} style={{ transformOrigin: "26px 34px" }}>
          <ellipse cx="26" cy="34" rx="3" ry={isThinking ? 2 : 3.5} fill="#1c1917" />
          <circle cx="25" cy="33" r="1" fill="white" />
        </motion.g>

        {/* Right eye */}
        <motion.g animate={blinkState ? { scaleY: 0.1 } : { scaleY: 1 }} style={{ transformOrigin: "38px 34px" }}>
          <ellipse cx="38" cy="34" rx="3" ry={isThinking ? 2 : 3.5} fill="#1c1917" />
          <circle cx="37" cy="33" r="1" fill="white" />
        </motion.g>

        {/* Nose */}
        <motion.ellipse
          cx="32"
          cy="40"
          rx="2"
          ry="1.5"
          fill="#fb7185"
          animate={isThinking ? { y: [0, -1, 0] } : { y: 0 }}
          transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
        />

        {/* Mouth */}
        <motion.path
          d={mouthPaths[mouthState]}
          stroke="#1c1917"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Whiskers - left */}
        <line x1="10" y1="36" x2="18" y2="38" stroke="#a8a29e" strokeWidth="0.8" />
        <line x1="10" y1="40" x2="18" y2="40" stroke="#a8a29e" strokeWidth="0.8" />
        <line x1="10" y1="44" x2="18" y2="42" stroke="#a8a29e" strokeWidth="0.8" />

        {/* Whiskers - right */}
        <line x1="54" y1="36" x2="46" y2="38" stroke="#a8a29e" strokeWidth="0.8" />
        <line x1="54" y1="40" x2="46" y2="40" stroke="#a8a29e" strokeWidth="0.8" />
        <line x1="54" y1="44" x2="46" y2="42" stroke="#a8a29e" strokeWidth="0.8" />
      </svg>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-white rounded-full"
              animate={{
                height: [4, 8, 4],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full" />
        </motion.div>
      )}

      {/* Listening indicator */}
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );
}
