import { useState, useEffect } from 'react'
import { startInterview, streamAnswer, completeInterview } from '@/lib/api'

export function useInterviewSession(settings, navigate) {
    const [session, setSession] = useState(null)
    const [currentQuestion, setCurrentQuestion] = useState(null)
    const [answer, setAnswer] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [responses, setResponses] = useState([])
    const [activeStage, setActiveStage] = useState('question')
    const [timeRemaining, setTimeRemaining] = useState(settings.duration * 60)
    const [latestFeedback, setLatestFeedback] = useState(null)
    const [error, setError] = useState(null)
    const [maxQuestions, setMaxQuestions] = useState(null) // Store max questions from backend

    // Initialize interview session
    useEffect(() => {
        async function init() {
            console.log('Starting interview with settings:', settings);
            setError(null);
            try {
                const sessionData = await startInterview(settings)
                setSession(sessionData)
                // Store max questions from backend
                if (sessionData.maxQuestions) {
                    setMaxQuestions(sessionData.maxQuestions)
                } else if (sessionData.settings?.maxQuestions) {
                    setMaxQuestions(sessionData.settings.maxQuestions)
                }
                // Adaptive: backend returns a single currentQuestion
                if (sessionData.currentQuestion) {
                    setCurrentQuestion(sessionData.currentQuestion)
                } else if (sessionData.questions && sessionData.questions.length > 0) {
                    // Fallback for legacy
                    setCurrentQuestion(sessionData.questions[0])
                }
            } catch (err) {
                console.error("Failed to start interview:", err);
                setError(err.message || 'Failed to start interview. Please try again.');
            }
        }
        init()
    }, [])

    // Timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) {
            // Time is up - mark interview as complete and generate report
            if (session?.id) {
                completeInterview(session.id).catch((err) => {
                    console.error('Error completing interview on timeout:', err);
                });
            }
            navigate('/report', { state: { responses } })
            return
        }

        const timer = setInterval(() => {
            setTimeRemaining((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeRemaining, session?.id])

    const submitCurrentAnswer = async () => {
        // Only allow submit when we are on the question stage and not already submitting
        if (!answer.trim() || isSubmitting || activeStage !== 'question') return

        setIsSubmitting(true)
        setError(null) // Clear previous errors
        setActiveStage('evaluation')
        setLatestFeedback(null) // Reset previous feedback

        try {
            // Stream the answer
            await streamAnswer(
                answer,
                currentQuestion?.id || currentQuestion?.question_id, // Support both ID formats
                session?.id, // Pass interview session ID
                (chunk) => {
                // Update feedback in real-time
                setLatestFeedback({
                    feedback: chunk.feedback,
                    scores: chunk.scores || { clarity: 0, coherence: 0, depth: 0, communication: 0, overall: 0 }
                })

                // Switch to feedback stage once we have some text
                if (chunk.feedback && activeStage !== 'feedback') {
                    setActiveStage('feedback')
                }
            },
            (finalResult) => {
                // Streaming complete
                setLatestFeedback(finalResult)

                const newResponse = { question: currentQuestion, answer, result: finalResult };
                setResponses((prev) => [...prev, newResponse])

                setActiveStage('feedback')
                setIsSubmitting(false)
                // Don't auto-advance - wait for user to click "Next Question" button
            }
        )
        } catch (err) {
            console.error('Error submitting answer:', err);
            setError(err.message || 'Failed to submit answer. Please try again.');
            setIsSubmitting(false);
            setActiveStage('question');
        }
    }

    /**
     * Move to the next question manually (called when user clicks "Next Question" button)
     */
    const moveToNextQuestion = async () => {
        if (!latestFeedback) return;

        const nextQ = latestFeedback.nextQuestion;
        
        // Check if interview is complete (from backend or by question count)
        const backendComplete = latestFeedback.isComplete === true;
        const questionLimit = maxQuestions || 7; // Fallback to 7 if not set
        const reachedLimit = responses.length >= questionLimit;
        const isFinished = backendComplete || !nextQ || reachedLimit;

        if (!isFinished && nextQ) {
            // Move to next question
            setCurrentQuestion(nextQ)
            setAnswer('')
            setActiveStage('question')
            setLatestFeedback(null)
        } else {
            // Interview is complete, tell backend to finalize and generate report
            if (session?.id) {
                try {
                    await completeInterview(session.id)
                } catch (err) {
                    console.error('Error completing interview:', err);
                }
            }
            // Then navigate to report using in-memory responses
            navigate('/report', { state: { responses } })
        }
    }

    return {
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
        maxQuestions, // Expose max questions for UI display
        submitAnswer: submitCurrentAnswer,
        moveToNextQuestion, // Function to manually move to next question
        canMoveToNext: !!latestFeedback && !isSubmitting && activeStage === 'feedback' // Whether "Next Question" button should be shown
    }
}
