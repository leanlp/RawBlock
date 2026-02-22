"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Trophy, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuizzes } from "@/data/quizzes";
import { useTranslation } from "@/lib/i18n";

export default function QuizModule({ nodeId }: { nodeId: string }) {
    const { t, locale } = useTranslation();
    const questions = getQuizzes(locale)[nodeId];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    if (!questions || questions.length === 0) return null;

    const question = questions[currentIndex];

    const handleSelectOption = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);
        if (index === question.correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setIsFinished(true);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
    };

    if (isFinished) {
        const passed = score === questions.length;
        return (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
                    <Trophy className={`h-8 w-8 ${passed ? "text-amber-400" : "text-slate-500"}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-200">
                    {t.academy.quiz.completeTitle}
                </h3>
                <p className="text-sm text-slate-400">
                    {t.academy.quiz.scoreOverview.replace("{0}", score.toString()).replace("{1}", questions.length.toString())}
                </p>
                {passed ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 mx-auto max-w-sm inline-flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {t.academy.quiz.badgeEarned}
                    </div>
                ) : (
                    <div className="text-sm text-slate-400">
                        {t.academy.quiz.retryPrompt}
                    </div>
                )}
                <div className="pt-4">
                    <button onClick={resetQuiz} className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                        <RefreshCcw className="w-4 h-4" /> {t.academy.quiz.retryButton}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {t.academy.quiz.knowledgeCheck}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{t.academy.quiz.questionXofY.replace("{0}", (currentIndex + 1).toString()).replace("{1}", questions.length.toString())}</p>
                </div>
            </div>

            <div className="text-sm md:text-base font-medium text-slate-200">
                {question.text}
            </div>

            <div className="grid gap-3">
                {question.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === question.correctIndex;
                    let styleClasses = "border-slate-800 bg-slate-950/70 hover:border-cyan-500/40 text-slate-300";

                    if (isAnswered) {
                        if (isCorrect) {
                            styleClasses = "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
                        } else if (isSelected && !isCorrect) {
                            styleClasses = "border-red-500/40 bg-red-500/10 text-red-200 opacity-60";
                        } else {
                            styleClasses = "border-slate-800/50 bg-slate-950/40 text-slate-500 opacity-40";
                        }
                    } else if (isSelected) {
                        styleClasses = "border-cyan-500/50 bg-cyan-500/20 text-cyan-200";
                    }

                    return (
                        <button
                            key={idx}
                            disabled={isAnswered}
                            onClick={() => handleSelectOption(idx)}
                            className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors duration-200 ${styleClasses}`}
                        >
                            <div className={`flex mt-0.5 h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isAnswered && isCorrect ? 'border-emerald-400' : 'border-slate-600'}`}>
                                {isAnswered && isCorrect && <span className="h-2 w-2 rounded-full bg-emerald-400"></span>}
                                {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-400 absolute" />}
                            </div>
                            <span className="text-sm leading-snug">{option}</span>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-lg border border-slate-700 bg-slate-800/40 p-4"
                    >
                        <p className="text-sm text-slate-300">
                            <strong>{t.academy.quiz.explanation}:</strong> {question.explanation}
                        </p>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleNext}
                                className="rounded bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
                            >
                                {currentIndex < questions.length - 1 ? t.academy.quiz.nextQuestion : t.academy.quiz.finishQuiz}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
