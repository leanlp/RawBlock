"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
    const [hasHydrated, setHasHydrated] = useState(false);
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    if (!hasHydrated) return <span>{value.toLocaleString()}</span>;

    return <motion.span>{display}</motion.span>;
}

export function AnimatedDecimalCounter({ value, decimals = 2, duration = 1.5 }: { value: number; decimals?: number; duration?: number }) {
    const [hasHydrated, setHasHydrated] = useState(false);
    const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
    const display = useTransform(spring, (current) => current.toFixed(decimals));

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    if (!hasHydrated) return <span>{value.toFixed(decimals)}</span>;

    return <motion.span>{display}</motion.span>;
}
