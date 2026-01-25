import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/shared'

export function FeedbackBlock({ feedback, onNextQuestion, showNextButton = false }) {
    if (!feedback) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
            >
                <GlassCard className="mt-4 border-l-4 border-l-accent-primary">
                    <h4 className="text-sm font-medium text-text-primary mb-2">
                        AI Feedback
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {feedback.feedback || feedback.interviewer_commentary || 'Feedback processing...'}
                    </p>
                </GlassCard>
            </motion.div>
        </AnimatePresence>
    )
}
