import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronRight, AlertCircle, X, ArrowRight } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import {
  QuestionBlock,
  EvaluationBlock,
  FeedbackBlock,
  PipelineBlock,
} from '@/components/flow'
import { useInterviewSession } from '@/hooks/useInterviewSession'
import { PIPELINE_STAGES } from '@/lib/constants'
import { cn, formatDuration } from '@/lib/utils'

export function Interview() {
  const navigate = useNavigate()
  const location = useLocation()
  const settings = location.state || { skills: ['react'], difficulty: 'mid', duration: 20 }

  const {
    session,
    currentQuestion,
    answer,
    setAnswer,
    isSubmitting,
    responses,
    activeStage,
    timeRemaining,
    latestFeedback,
    error,
    maxQuestions,
    submitAnswer,
    moveToNextQuestion,
    canMoveToNext,
  } = useInterviewSession(settings, navigate)

  const handleEndInterview = () => {
    // If there are no responses yet, don't show a demo/empty report
    if (!responses || responses.length === 0) {
      navigate('/setup')
      return
    }

    navigate('/report', { state: { responses } })
  }

  const stages = PIPELINE_STAGES.filter((s) =>
    ['question', 'memory', 'evaluation', 'feedback'].includes(s.id)
  )

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      {/* Top Bar */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-surface-elevated/95 backdrop-blur-sm border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="default">
              Question {responses.length + 1}{maxQuestions ? ` / ${maxQuestions}` : ''}
            </Badge>
            <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="w-4 h-4" />
              {formatDuration(timeRemaining)}
            </div>
          </div>

          {/* Mini Pipeline */}
          <div className="hidden md:flex items-center gap-1">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center">
                <div
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    activeStage === stage.id
                      ? 'bg-accent-primaryMuted text-accent-primary'
                      : 'text-text-muted'
                  )}
                >
                  {stage.name}
                </div>
                {index < stages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-text-muted mx-0.5" />
                )}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={handleEndInterview}>
            End Interview
          </Button>
        </div>
      </motion.header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 pt-20 pb-8 px-4">
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="max-w-6xl mx-auto mb-4 p-4 rounded-lg bg-semantic-errorMuted/50 border border-semantic-error/30 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-semantic-error mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-semantic-error mb-1">Error</p>
                <p className="text-sm text-semantic-error/90">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-semantic-error hover:text-semantic-error/80 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-6 h-full">
          {/* Left Panel - Active Stage */}
          <motion.aside
            className="lg:col-span-3 hidden lg:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PipelineBlock stages={stages} activeStage={activeStage} />
          </motion.aside>

          {/* Center - Question & Answer */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <QuestionBlock
              question={currentQuestion}
              difficulty={settings.difficulty}
              answer={answer}
              setAnswer={setAnswer}
              isSubmitting={isSubmitting}
              onSubmit={submitAnswer}
            />
            {/* Feedback is now shown below the question when available */}
            <FeedbackBlock feedback={latestFeedback} />
            
            {/* Next Question Button - appears after feedback is complete */}
            <AnimatePresence>
              {canMoveToNext && latestFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6"
                >
                  <GlassCard className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary mb-1">
                          {latestFeedback.isComplete || !latestFeedback.nextQuestion
                            ? 'Interview Complete!'
                            : 'Ready for the next question?'}
                        </p>
                        <p className="text-xs text-text-muted">
                          {latestFeedback.isComplete || !latestFeedback.nextQuestion
                            ? 'Review your feedback and view your final report'
                            : 'Take your time to review the feedback before proceeding'}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={moveToNextQuestion}
                        className="w-full sm:w-auto"
                      >
                        {latestFeedback.isComplete || !latestFeedback.nextQuestion
                          ? 'View Report'
                          : 'Next Question'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Panel - Real-time Analysis */}
          <motion.aside
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <EvaluationBlock feedback={latestFeedback} />
          </motion.aside>
        </div>
      </main>
    </div>
  )
}

export default Interview
