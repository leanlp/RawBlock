"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../components/PageHeader';
import { Map, Lock, CheckCircle, ArrowRight, Play, RefreshCcw } from 'lucide-react';
import { useLearningPath, CURRICULUM, CurriculumModule } from '../../../stores/learningPathStore';

export default function AcademyPathsPage() {
    const router = useRouter();
    const { isLoaded, completedModules, isModuleUnlocked, getProgressPercentage, resetProgress } = useLearningPath();

    if (!isLoaded) {
        return (
            <div className="w-full min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const progressPercent = getProgressPercentage();

    const handleStartModule = (module: CurriculumModule) => {
        if (!isModuleUnlocked(module.id)) return;
        router.push(module.pathUrl);
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            {/* Header & Progress Stats */}
            <div className="mb-12">
                <PageHeader
                    title="Guided Learning Paths"
                    subtitle="Master Bitcoin engineering through hands-on, progressive interactive labs. Complete modules to unlock advanced simulations."
                    icon={<Map className="text-emerald-400" size={32} />}
                />

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Curriculum Progress</h3>
                            <span className="text-emerald-400 font-mono font-bold text-xl">{progressPercent}%</span>
                        </div>
                        <div className="h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400"
                            />
                        </div>
                    </div>

                    <button
                        onClick={resetProgress}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider flex items-center gap-1 whitespace-nowrap"
                        title="Erase local progress and start over"
                    >
                        <RefreshCcw size={14} /> Reset History
                    </button>
                </div>
            </div>

            {/* The Skill Tree */}
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 md:before:ml-[2.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">

                {CURRICULUM.map((module, idx) => {
                    const isCompleted = completedModules.includes(module.id);
                    const isUnlocked = isModuleUnlocked(module.id);

                    // Determine styling based on state
                    const cardBorder = isCompleted ? 'border-emerald-500/50' : isUnlocked ? 'border-indigo-500/50' : 'border-slate-800';
                    const cardBg = isCompleted ? 'bg-emerald-950/20' : isUnlocked ? 'bg-indigo-950/20' : 'bg-slate-900/50 opacity-60';
                    const iconBg = isCompleted ? 'bg-emerald-500 shadow-emerald-500/20' : isUnlocked ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-slate-800';
                    const titleColor = isCompleted ? 'text-emerald-400' : isUnlocked ? 'text-white' : 'text-slate-500';

                    return (
                        <div key={module.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none">

                            {/* Central Node Timeline Icon */}
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10 ${iconBg} transition-colors duration-500`}>
                                {isCompleted ? (
                                    <CheckCircle size={16} className="text-slate-950" />
                                ) : isUnlocked ? (
                                    <Play size={16} className="text-white ml-0.5" />
                                ) : (
                                    <Lock size={16} className="text-slate-500" />
                                )}
                            </div>

                            {/* Module Card */}
                            <motion.div
                                whileHover={isUnlocked ? { scale: 1.02, y: -2 } : {}}
                                className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border transition-all cursor-${isUnlocked ? 'pointer' : 'not-allowed'} ${cardBg} ${cardBorder}`}
                                onClick={() => handleStartModule(module)}
                            >
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                            Module {idx + 1}
                                        </span>
                                        {isCompleted && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                                                Completed
                                            </span>
                                        )}
                                        {!isUnlocked && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-700 bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Lock size={10} /> Locked
                                            </span>
                                        )}
                                    </div>
                                    <h4 className={`text-xl font-bold ${titleColor}`}>{module.title}</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed mt-1">
                                        {module.description}
                                    </p>

                                    {isUnlocked && !isCompleted && (
                                        <div className="mt-4 flex items-center text-indigo-400 text-xs font-bold uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
                                            Start Module <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
