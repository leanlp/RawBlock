"use client";

import { useState, useEffect, useCallback } from 'react';

// Define the Modules in our Curriculum
export type ModuleId = 'mining_basics' | 'script_consensus' | 'lightning_routing' | 'mempool_rbf';

export interface CurriculumModule {
    id: ModuleId;
    title: string;
    description: string;
    iconUrl?: string;
    prerequisites: ModuleId[];
    pathUrl: string;
}

export const CURRICULUM: CurriculumModule[] = [
    {
        id: 'mining_basics',
        title: 'Mining & Difficulty',
        description: 'Understand the Bitcoin heartbeat. Master hashrate, block times, and the 2016-block difficulty adjustment epoch.',
        prerequisites: [], // Starter module
        pathUrl: '/lab/mining'
    },
    {
        id: 'script_consensus',
        title: 'Script Evaluation',
        description: 'Dive into the stack machine. Construct and evaluate Bitcoin Scripts against live consensus rules.',
        prerequisites: ['mining_basics'],
        pathUrl: '/lab/script'
    },
    {
        id: 'mempool_rbf',
        title: 'Mempool & RBF',
        description: 'Navigate the fee market. Debug failed transactions and execute live Replace-By-Fee (RBF) double spends.',
        prerequisites: ['script_consensus'],
        pathUrl: '/lab/scenarios'
    },
    {
        id: 'lightning_routing',
        title: 'Lightning Routing',
        description: 'Explore Layer 2. Map the enterprise node topology and simulate liquidity-constrained payment routing.',
        prerequisites: ['mempool_rbf'],
        pathUrl: '/lab/lightning' // Assuming this path from earlier phases
    }
];

const STORE_KEY = 'rawblock_learning_progress_v1';

// Internal structure for LocalStorage
interface ProgressState {
    completedModules: ModuleId[];
}

/**
 * Custom React Hook to manage user progression across the Academy.
 * Syncs seamlessly with `localStorage` for cross-page persistence.
 */
export function useLearningPath() {
    const [progress, setProgress] = useState<ProgressState>({ completedModules: [] });
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORE_KEY);
            if (saved) {
                setProgress(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to parse learning progression', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save on changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORE_KEY, JSON.stringify(progress));
        }
    }, [progress, isLoaded]);

    const completeModule = useCallback((id: ModuleId) => {
        setProgress(prev => {
            if (prev.completedModules.includes(id)) return prev;
            return { ...prev, completedModules: [...prev.completedModules, id] };
        });
    }, []);

    const resetProgress = useCallback(() => {
        setProgress({ completedModules: [] });
    }, []);

    const isModuleUnlocked = useCallback((id: ModuleId): boolean => {
        const mod = CURRICULUM.find(m => m.id === id);
        if (!mod) return false;
        
        // If it has no prerequisites, it's always unlocked
        if (mod.prerequisites.length === 0) return true;
        
        // Check if ALL prerequisites are in the completed arrays
        return mod.prerequisites.every(prereq => progress.completedModules.includes(prereq));
    }, [progress.completedModules]);

    const getProgressPercentage = useCallback((): number => {
        if (CURRICULUM.length === 0) return 0;
        return Math.round((progress.completedModules.length / CURRICULUM.length) * 100);
    }, [progress.completedModules]);

    return {
        completedModules: progress.completedModules,
        isLoaded,
        completeModule,
        resetProgress,
        isModuleUnlocked,
        getProgressPercentage
    };
}
