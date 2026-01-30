import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Square } from 'lucide-react'
import { Button, Badge, Textarea } from '@/components/ui'
import { GlassCard } from '@/components/shared'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

export function QuestionBlock({
    question,
    difficulty,
    answer,
    setAnswer,
    isSubmitting,
    onSubmit,
}) {
    const onSpeechResult = useCallback((transcript, isInterim) => {
        if (!isInterim) setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }, [setAnswer])

    const {
        isSupported: isSpeechSupported,
        isListening,
        error: speechError,
        startListening,
        stopListening,
    } = useSpeechRecognition({ onResult: onSpeechResult })

    const toggleMic = () => {
        if (isListening) stopListening()
        else startListening()
    }

    return (
        <GlassCard variant="elevated" className="min-h-96">
            <AnimatePresence mode="wait">
                {question ? (
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Badge variant="secondary" className="mb-4">
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
                        </Badge>
                        <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 leading-relaxed">
                            {question.text}
                        </h2>

                        <div className="space-y-4">
                            <div className="relative">
                                <Textarea
                                    className="h-48 pr-12"
                                    placeholder="Type your answer here, or use the microphone to speak... Be thorough and structured in your response."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                {isSpeechSupported && (
                                    <div className="absolute right-3 top-3 flex flex-col gap-1">
                                        <Button
                                            type="button"
                                            variant={isListening ? 'destructive' : 'secondary'}
                                            size="icon"
                                            onClick={toggleMic}
                                            disabled={isSubmitting}
                                            title={isListening ? 'Stop speaking' : 'Speak your answer'}
                                            className="h-9 w-9 shrink-0"
                                        >
                                            {isListening ? (
                                                <Square className="h-4 w-4" aria-hidden />
                                            ) : (
                                                <Mic className="h-4 w-4" aria-hidden />
                                            )}
                                        </Button>
                                        {isListening && (
                                            <span className="text-[10px] text-text-muted whitespace-nowrap">
                                                Listening...
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            {speechError && (
                                <p className="text-sm text-semantic-error" role="alert">
                                    {speechError}
                                </p>
                            )}
                            {!isSpeechSupported && (
                                <p className="text-xs text-text-muted">
                                    Voice input is not supported in this browser. Use Chrome or Edge for speak-to-type.
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-muted">
                                    {answer.split(' ').filter(Boolean).length} words
                                </span>
                                <Button
                                    onClick={onSubmit}
                                    disabled={!answer.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <motion.div
                                                className="w-4 h-4 border-2 border-text-inverse/30 border-t-text-inverse rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            Submit Answer
                                            <Send className="w-4 h-4 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <motion.div
                            className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}
