const { generateContentWithFallback } = require('../../config/github-models-helper');

class EvaluationBlock {
    async evaluateAnswer(context) {
        // Unpack context: question, answer, role, skill, level
        const { question, answer, role, skill, level } = context;

        // Determine expected answer quality based on experience level
        const levelExpectations = {
            'Junior': {
                depth: 'Basic understanding, definitions, simple examples',
                correctness: 'Fundamental concepts should be correct',
                clarity: 'Clear communication even if simple',
                examples: 'At least one simple example expected'
            },
            'Mid-Level': {
                depth: 'Moderate depth, some trade-offs, practical applications',
                correctness: 'Mostly correct with minor gaps acceptable',
                clarity: 'Well-structured explanation',
                examples: 'Real-world examples and use cases expected'
            },
            'Senior': {
                depth: 'Deep understanding, system design considerations, edge cases',
                correctness: 'Highly accurate, nuanced understanding',
                clarity: 'Articulate, comprehensive explanation',
                examples: 'Multiple examples, edge cases, and trade-offs expected'
            },
            'Staff+': {
                depth: 'Expert-level depth, architectural thinking, scalability',
                correctness: 'Expert-level accuracy with advanced concepts',
                clarity: 'Exceptional communication, strategic thinking',
                examples: 'Complex examples, system-level thinking, industry patterns'
            }
        };

        const expectations = levelExpectations[level] || levelExpectations['Mid-Level'];
        const answerLength = answer.trim().length;
        const hasExamples = /example|instance|case|scenario|use|when|where/i.test(answer);
        const hasTechnicalTerms = /algorithm|data structure|pattern|architecture|design|optimization|scalability|performance/i.test(answer);

        const prompt = `You are a senior technical interviewer at a top tech company (Google, Meta, Amazon, Microsoft). You are strict, fair, analytical, and provide accurate, nuanced evaluations.

CRITICAL: Respond with valid JSON only, no markdown formatting, no code blocks, just the raw JSON object.

EVALUATION CONTEXT:
- Role: ${role}
- Skill Focus: ${skill}
- Experience Level: ${level}
- Expected Quality: ${JSON.stringify(expectations)}

QUESTION DETAILS:
"${question.text || question.question_text}"
Question Difficulty: ${question.difficulty || 'medium'}

CANDIDATE ANSWER:
"${answer}"
Answer Length: ${answerLength} characters
Contains Examples: ${hasExamples}
Contains Technical Terms: ${hasTechnicalTerms}

SCORING RUBRIC (0-10 scale, be precise and fair):

1. RELEVANCE_SCORE (0-10):
   - 9-10: Directly addresses the question, on-topic, no evasion
   - 7-8: Mostly relevant, minor tangents acceptable
   - 5-6: Partially relevant, some off-topic content
   - 3-4: Mostly off-topic or evasive
   - 0-2: Completely off-topic, hallucinated, or evasive

2. CORRECTNESS_SCORE (0-10):
   - 9-10: Factually accurate, no errors, technically sound
   - 7-8: Mostly correct, minor inaccuracies acceptable
   - 5-6: Partially correct, some misconceptions
   - 3-4: Several errors or significant misconceptions
   - 0-2: Major factual errors or completely incorrect

3. DEPTH_SCORE (0-10) - Adjusted for experience level:
   For ${level} level, expect: ${expectations.depth}
   - 9-10: Exceeds expectations for level, deep understanding
   - 7-8: Meets expectations for level, good depth
   - 5-6: Below expectations, surface-level understanding
   - 3-4: Very shallow, minimal understanding
   - 0-2: No depth, just definitions or buzzwords

4. CLARITY_SCORE (0-10):
   - 9-10: Exceptionally clear, well-structured, easy to follow
   - 7-8: Clear and understandable, good structure
   - 5-6: Somewhat clear but could be better organized
   - 3-4: Unclear or confusing in parts
   - 0-2: Very unclear, poorly structured, hard to follow

5. CONFIDENCE_SCORE (0-10):
   - 9-10: Confident, decisive, specific examples, no hedging
   - 7-8: Mostly confident, some uncertainty acceptable
   - 5-6: Somewhat uncertain, vague language
   - 3-4: Lacks confidence, many qualifiers
   - 0-2: Very uncertain, lots of "I think", "maybe", "not sure"

6. OVERALL_SCORE (0-10):
   Calculate as weighted average:
   - Relevance: 20%
   - Correctness: 30%
   - Depth: 25%
   - Clarity: 15%
   - Confidence: 10%
   
   Then adjust based on:
   - Experience level expectations (${level} should meet ${expectations.depth})
   - Answer completeness (did they address all parts of the question?)
   - Technical accuracy for the role (${role})

SPECIAL CONSIDERATIONS:
- If answer is very short (< 50 chars) and vague: penalize depth and clarity
- If answer has examples: reward depth and clarity
- If answer has technical details: reward correctness and depth
- If answer is off-topic: relevance_score <= 3, overall_score <= 3
- If answer shows misunderstanding: correctness_score <= 5, provide specific mistakes
- If answer exceeds expectations for level: reward with higher scores

Evaluate this answer rigorously and return ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "relevance_score": <0-10 integer>,
  "correctness_score": <0-10 integer>,
  "depth_score": <0-10 integer>,
  "clarity_score": <0-10 integer>,
  "confidence_score": <0-10 integer>,
  "overall_score": <0-10 integer, calculated weighted average>,
  "is_answer_relevant": <true/false>,
  "is_factually_correct": <true/false>,
  "hallucination_detected": <true/false>,
  "answer_type": "correct | partially_correct | incorrect | off_topic | vague",
  "mistakes": ["Specific technical errors or misconceptions"],
  "missing_points": ["Key concepts or aspects not addressed"],
  "strengths": ["What the candidate did well"],
  "improvement_feedback": ["Actionable, specific suggestions"],
  "next_question_difficulty": "easier | same | harder",
  "suggested_followup_question": "Follow-up question text",
  "interviewer_commentary": "Natural language feedback explaining the scores."
}`;

        try {
            // Validate inputs
            if (!question || !answer) {
                throw new Error("Missing question or answer");
            }

            // Check if API key is configured
            if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN.trim() === '') {
                throw new Error("GITHUB_TOKEN is not configured. Please set it in your .env file and restart the server.");
            }

            // Try with JSON format first, but it will fallback if not supported
            // Increased max_tokens for more detailed evaluation
            const result = await generateContentWithFallback(prompt, { 
                temperature: 0.5, // Lower temperature for more consistent scoring
                max_tokens: 1500  // Increased for more detailed evaluation
                // Note: response_format will be added by the helper if supported
            });
            
            // GitHub Models API returns response in Azure AI Inference format
            let text;
            if (result.responseText) {
                text = result.responseText;
            } else if (result.response) {
                text = typeof result.response.text === 'function' 
                    ? result.response.text() 
                    : await result.response.textAsync();
            } else {
                throw new Error("No response text found in API response");
            }
            
            if (!text || text.trim().length === 0) {
                throw new Error("Empty response from AI model");
            }
            
            // Parse JSON response
            let evaluation;
            try {
                // Try to parse as JSON directly
                let jsonStr = text.trim();
                // Remove markdown code blocks if present
                jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                
                // Try to find JSON object in the text
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
                
                evaluation = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                console.error("Response text:", text?.substring(0, 500) || 'No text');
                throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
            }

            // Validate required fields
            if (!evaluation.overall_score && evaluation.overall_score !== 0) {
                throw new Error("Missing overall_score in evaluation response");
            }

            // Normalize and validate scores (ensure they're 0-10)
            const normalizeScore = (score, defaultVal = 5) => {
                if (score === null || score === undefined) return defaultVal;
                const num = typeof score === 'string' ? parseFloat(score) : score;
                return Math.max(0, Math.min(10, Math.round(num * 10) / 10)); // Round to 1 decimal
            };

            const relevance_score = normalizeScore(evaluation.relevance_score, 5);
            const correctness_score = normalizeScore(evaluation.correctness_score, 5);
            const depth_score = normalizeScore(evaluation.depth_score, 5);
            const clarity_score = normalizeScore(evaluation.clarity_score, 5);
            const confidence_score = normalizeScore(evaluation.confidence_score, 5);

            // Calculate weighted overall score if not provided or seems incorrect
            let overall_score = normalizeScore(evaluation.overall_score, 5);
            
            // Recalculate if the provided overall_score seems inconsistent
            const calculatedOverall = (
                relevance_score * 0.20 +
                correctness_score * 0.30 +
                depth_score * 0.25 +
                clarity_score * 0.15 +
                confidence_score * 0.10
            );
            
            // Use calculated if provided score is way off (difference > 2 points)
            if (Math.abs(overall_score - calculatedOverall) > 2) {
                console.log(`Recalculating overall_score: provided=${overall_score}, calculated=${calculatedOverall.toFixed(1)}`);
                overall_score = Math.round(calculatedOverall * 10) / 10;
            }

            // Ensure all required fields exist
            return {
                relevance_score,
                correctness_score,
                depth_score,
                clarity_score,
                confidence_score,
                overall_score,
                is_answer_relevant: evaluation.is_answer_relevant ?? (relevance_score >= 5),
                is_factually_correct: evaluation.is_factually_correct ?? (correctness_score >= 5),
                hallucination_detected: evaluation.hallucination_detected ?? false,
                answer_type: evaluation.answer_type || (overall_score >= 7 ? 'correct' : overall_score >= 4 ? 'partially_correct' : 'incorrect'),
                mistakes: Array.isArray(evaluation.mistakes) ? evaluation.mistakes : [],
                missing_points: Array.isArray(evaluation.missing_points) ? evaluation.missing_points : [],
                strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
                improvement_feedback: Array.isArray(evaluation.improvement_feedback) ? evaluation.improvement_feedback : [],
                next_question_difficulty: evaluation.next_question_difficulty || (overall_score >= 7 ? 'harder' : overall_score <= 4 ? 'easier' : 'same'),
                suggested_followup_question: evaluation.suggested_followup_question || '',
                interviewer_commentary: evaluation.interviewer_commentary || 'Evaluation completed.'
            };

        } catch (error) {
            console.error("Evaluation Error Details:", {
                message: error.message,
                stack: error.stack,
                question: question?.text || question?.question_text || 'N/A',
                answerLength: answer?.length || 0
            });

            // Provide more specific error messages based on error type
            let errorMessage = "Could not evaluate answer at this time.";
            let detailedError = error.message || 'Unknown error';
            
            if (error.message?.includes('API key') || error.message?.includes('GITHUB_TOKEN')) {
                errorMessage = "API configuration error. Please check your GitHub token in .env file. Make sure it has models:read permissions.";
            } else if (error.isModelError || error.message?.toLowerCase().includes('unknown model') || 
                       (error.message?.toLowerCase().includes('model') && error.message?.toLowerCase().includes('not found'))) {
                errorMessage = "Model not found. Please check your GITHUB_MODEL setting in .env file. The system will try alternative models.";
            } else if (error.isCreditLimit || error.message?.toLowerCase().includes('credit') || error.message?.toLowerCase().includes('afford')) {
                errorMessage = "Insufficient credits or rate limit reached. Please check your GitHub Models usage or reduce the request size. The system has been configured to use fewer tokens.";
            } else if (error.message?.includes('rate limit') || error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('exceeded')) {
                errorMessage = "API quota/rate limit exceeded. The system will automatically retry, but you may need to wait or check your GitHub Models usage.";
            } else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
                errorMessage = "Received invalid response from AI. The model response could not be parsed.";
            } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
                errorMessage = "Network error. Please check your internet connection.";
            } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                errorMessage = "API access denied. Please verify your GitHub token is valid and has models:read permissions.";
            } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                errorMessage = "API authentication failed. Please check your GitHub token has models:read permissions.";
            } else if (error.message?.includes('Empty response')) {
                errorMessage = "AI model returned an empty response. Please try again.";
            }
            
            // Log the full error for debugging
            console.error("Full evaluation error:", {
                name: error.name,
                message: error.message,
                stack: error.stack?.substring(0, 500)
            });

            // Fallback evaluation with helpful message
            return {
                relevance_score: 5,
                correctness_score: 5,
                depth_score: 5,
                clarity_score: 5,
                confidence_score: 5,
                overall_score: 5,
                is_answer_relevant: true,
                is_factually_correct: false,
                hallucination_detected: false,
                answer_type: "vague",
                mistakes: [],
                missing_points: [],
                strengths: [],
                improvement_feedback: [errorMessage],
                next_question_difficulty: "same",
                suggested_followup_question: "Please try answering again.",
                interviewer_commentary: `${errorMessage} (Error: ${error.message || 'Unknown error'})`
            };
        }
    }
}

module.exports = new EvaluationBlock();
