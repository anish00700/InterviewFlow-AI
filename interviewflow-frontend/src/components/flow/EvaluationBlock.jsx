import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { Progress } from '@/components/ui'
import { GlassCard } from '@/components/shared'

export function EvaluationBlock({ feedback, title = "Live Analysis" }) {
    return (
        <GlassCard className="sticky top-24">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
                {title}
            </h3>

            <AnimatePresence mode="wait">
                {feedback ? (
                    <motion.div
                        key="feedback"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-4"
                    >
                        {Object.entries(feedback.scores)
                            .filter(([key]) => key !== 'overall')
                            .map(([metric, score]) => (
                                <div key={metric}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-text-secondary capitalize">
                                            {metric}
                                        </span>
                                        <span className="font-medium text-text-primary">
                                            {score}%
                                        </span>
                                    </div>
                                    <Progress value={score} variant="default" />
                                </div>
                            ))}

                        <div className="pt-4 border-t border-border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-text-primary">
                                    Overall Score
                                </span>
                                <span className="text-2xl font-semibold text-accent-primary">
                                    {feedback.scores.overall}%
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="waiting"
                        className="text-center py-8 text-text-muted"
                    >
                        <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                            Submit your answer to see real-time analysis
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}
