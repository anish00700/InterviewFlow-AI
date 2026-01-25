import { motion } from 'framer-motion'
import { MessageCircle, Brain, BarChart3, Lightbulb } from 'lucide-react'
import { GlassCard } from '@/components/shared'
import { cn } from '@/lib/utils'

export function PipelineBlock({ stages, activeStage }) {
    const getStageIcon = (stageId) => {
        switch (stageId) {
            case 'question': return MessageCircle
            case 'memory': return Brain
            case 'evaluation': return BarChart3
            case 'feedback': return Lightbulb
            default: return MessageCircle
        }
    }

    return (
        <GlassCard className="sticky top-24">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">
                Interview Pipeline
            </h3>
            <div className="space-y-2">
                {stages.map((stage) => {
                    const Icon = getStageIcon(stage.id)
                    return (
                        <motion.div
                            key={stage.id}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-lg transition-all',
                                activeStage === stage.id
                                    ? 'bg-accent-primaryMuted/30 border border-accent-primary/20'
                                    : 'opacity-50'
                            )}
                            animate={
                                activeStage === stage.id
                                    ? { scale: [1, 1.01, 1] }
                                    : {}
                            }
                            transition={{ duration: 0.3 }}
                        >
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center',
                                    activeStage === stage.id
                                        ? 'bg-accent-primary text-text-inverse'
                                        : 'bg-surface-muted text-text-muted'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-text-primary">
                                    {stage.name}
                                </div>
                                <div className="text-xs text-text-muted">
                                    {stage.description}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </GlassCard>
    )
}
