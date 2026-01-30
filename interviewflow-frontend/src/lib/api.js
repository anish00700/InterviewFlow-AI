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

/**
 * Analyze resume and extract topics/skills
 */
export async function analyzeResume(file) {
  try {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/api/resume/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to analyze resume' }));
      throw new Error(errorData.message || 'Failed to analyze resume');
    }

    return await response.json(); // { topics, rawSkills }
  } catch (error) {
    console.error('Resume analysis error:', error);
    throw error;
  }
}

/**
 * Analyze resume for ATS score and recommendations
 */
export async function analyzeResumeATS(file, targetRole) {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    if (targetRole) {
      formData.append('targetRole', targetRole);
    }

    const response = await fetch(`${API_BASE_URL}/api/resume/ats`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to analyze resume' }));
      throw new Error(errorData.message || 'Failed to analyze resume');
    }

    return await response.json(); // { overallScore, sectionScores, summary, strengths, issues, missingKeywords, recommendations }
  } catch (error) {
    console.error('Resume ATS analysis error:', error);
    throw error;
  }
}

/**
 * Get interview history for the current user
 */
export async function getInterviewHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch history' }));
      throw new Error(errorData.message || 'Failed to fetch history');
    }

    return await response.json(); // { items: [...] }
  } catch (error) {
    console.error('History API error:', error);
    throw error;
  }
}

/**
 * Mark interview as completed and generate/save final report
 */
export async function completeInterview(interviewId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/${interviewId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to complete interview' }));
      throw new Error(errorData.message || 'Failed to complete interview');
    }

    return await response.json(); // { message, overallScore, report }
  } catch (error) {
    console.error('Complete interview API error:', error);
    throw error;
  }
}

/**
 * Get report and history for an interview (for viewing report by id from History)
 */
export async function getReportByInterviewId(interviewId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/interview/${interviewId}/report`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch report' }));
      throw new Error(errorData.message || 'Failed to fetch report');
    }

    return await response.json(); // { report, history, interview }
  } catch (error) {
    console.error('Get report by interview id API error:', error);
    throw error;
  }
}



