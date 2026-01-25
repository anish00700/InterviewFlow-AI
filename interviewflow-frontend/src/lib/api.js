import { delay, API_BASE_URL } from './utils'

/**
 * Start a new interview session
 */
export async function startInterview(settings) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to start interview' }));
      throw new Error(errorData.message || 'Failed to start interview');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Submit an answer and receive AI evaluation via simulated stream
 * mimics Server-Sent Events (SSE) but fetches data from real backend first
 */
export async function streamAnswer(text, questionId, interviewId, onChunk, onComplete) {
  // 1. Call Real Backend to get the evaluation
  let finalResult;
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/answer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ answer: text, questionId, interviewId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit answer' }));
      throw new Error(errorData.message || 'Failed to submit answer');
    }
    finalResult = await response.json();
  } catch (error) {
    console.error('API Error:', error);
    onComplete({
      feedback: error.message || "Network or Server Error. Please check your connection or API key.",
      scores: { clarity: 0, coherence: 0, depth: 0, communication: 0, overall: 0 },
      // Return null nextQuestion to gracefully end or handle retry logic in hook
      nextQuestion: null
    });
    return;
  }

  // 2. Simulate Streaming (Jagged typing effect) on the Client
  // This preserves the nice UX while using real backend data
  const fullFeedbackText = finalResult?.feedback || "Evaluation complete."
  const words = fullFeedbackText.split(' ')
  let currentText = ''

  // Send initial analysing event
  onChunk({ status: 'analyzing', feedback: '', scores: null })

  for (let i = 0; i < words.length; i++) {
    // Variable delay between words to feel like "thinking"
    await delay(50 + Math.random() * 100)

    currentText += words[i] + ' '

    // Gradually reveal scores as if they are being calculated
    const partialScores = i > words.length / 2 ? finalResult.scores : null

    onChunk({
      status: 'streaming',
      feedback: currentText.trim(),
      scores: partialScores
    })
  }

  // Final event with everything
  onComplete(finalResult)
}
