"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedBlockLogo() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-24 h-24 sm:w-32 sm:h-32 opacity-0" />;
    }

    return (
        <div className="w-24 h-24 sm:w-32 sm:h-32 relative mx-auto lg:mx-0 flex items-center justify-center drop-shadow-[0_0_15px_rgba(13,204,242,0.3)]">
            <motion.svg
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible"
                initial="hidden"
                animate="visible"
            >
                {/* Background glowing core */}
                <motion.circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="url(#core-glow)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />

                {/* Outer Hexagon / Block Shape */}
                <motion.path
                    d="M 50 5 L 89 27.5 L 89 72.5 L 50 95 L 11 72.5 L 11 27.5 Z"
                    fill="rgba(15, 23, 42, 0.4)"
                    stroke="url(#cyan-purple)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
                />

                {/* Inner 3D Lines (Top Face) */}
                <motion.path
                    d="M 11 27.5 L 50 50 L 89 27.5"
                    fill="none"
                    stroke="url(#cyan-purple)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                />

                {/* Inner 3D Line (Vertical Edge) */}
                <motion.path
                    d="M 50 50 L 50 95"
                    fill="none"
                    stroke="url(#cyan-purple)"
                    strokeWidth="1"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.7 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                />

                {/* Abstract Node Network inside the block */}
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2.5 }}
                >
                    <circle cx="50" cy="50" r="3" fill="#0dccf2" />
                    <circle cx="30" cy="35" r="2" fill="#7f0df2" />
                    <circle cx="70" cy="35" r="2" fill="#0dccf2" />
                    <circle cx="50" cy="75" r="2" fill="#7f0df2" />
                    <circle cx="30" cy="65" r="1.5" fill="#0dccf2" />
                    <circle cx="70" cy="65" r="1.5" fill="#7f0df2" />

                    {/* Connecting lines */}
                    <motion.path
                        d="M 50 50 L 30 35 M 50 50 L 70 35 M 50 50 L 50 75 M 30 35 L 30 65 M 70 35 L 70 65 M 30 65 L 50 75 M 70 65 L 50 75"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                        strokeDasharray="2 2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut", delay: 2.5 }}
                    />
                </motion.g>

                {/* Floating particles around the block */}
                {[
                    { cx: 80, cy: 15, r: 1 },
                    { cx: 20, cy: 85, r: 1.5 },
                    { cx: 15, cy: 15, r: 1 },
                    { cx: 85, cy: 85, r: 1 },
                    { cx: 95, cy: 50, r: 1.5 },
                ].map((particle, i) => (
                    <motion.circle
                        key={i}
                        cx={particle.cx}
                        cy={particle.cy}
                        r={particle.r}
                        fill="#0dccf2"
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 0.8, 0], y: [-5, 5, -5] }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5
                        }}
                    />
                ))}

                {/* Gradients */}
                <defs>
                    <linearGradient id="cyan-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0dccf2" />
                        <stop offset="100%" stopColor="#7f0df2" />
                    </linearGradient>
                    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0dccf2" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                </defs>
            </motion.svg>
        </div>
    );
}
