const { generateContentWithFallback } = require('../../config/github-models-helper');

/**
 * Adaptation Block - The Decision Engine
 * 
 * This block analyzes the current cognitive state and decides:
 * - What difficulty level the next question should be
 * - What topic/concept to probe next
 * - What type of question to ask (foundational, deep, scenario, follow-up)
 * - Whether to switch topics or go deeper
 * 
 * This simulates how a real interviewer adapts strategy in real-time.
 */
class AdaptationBlock {
    /**
     * Analyze cognitive state and determine next question strategy
     * 
     * @param {Object} cognitiveState - Current interview cognitive state
     * @param {Object} lastEvaluation - Most recent answer evaluation
     * @param {Number} turnNumber - Current turn number
     * @param {Array} recentTurns - Last 3-5 turns for trend analysis
     * @param {Object} roleContext - Role, level, skills being tested
     * 
     * @returns {Object} Adaptation decision with reasoning
     */
    async decideNextStrategy(cognitiveState, lastEvaluation, turnNumber, recentTurns, roleContext) {
        const {
            performanceTrend,
            currentDifficulty,
            conceptMastery,
            detectedStrengths,
            detectedWeaknesses,
            confidenceTrend,
            clarityTrend,
            learningCurve
        } = cognitiveState;

        const {
            role,
            experienceLevel,
            skills
        } = roleContext;

        // Build context summary for AI reasoning
        const contextSummary = this._buildContextSummary(
            cognitiveState,
            lastEvaluation,
            turnNumber,
            recentTurns,
            roleContext
        );

        const prompt = `
        You are an expert interviewer making real-time adaptation decisions.
        Your goal is to simulate how a senior interviewer thinks and adjusts strategy.

        Interview Context:
        Role: ${role}
        Experience Level: ${experienceLevel}
        Skills Being Tested: ${skills.join(', ')}
        Current Turn: ${turnNumber}

        Cognitive State Analysis:
        ${contextSummary}

        Last Answer Evaluation:
        - Overall Score: ${lastEvaluation.overall_score}/10
        - Relevance: ${lastEvaluation.relevance_score}/10
        - Correctness: ${lastEvaluation.correctness_score}/10
        - Depth: ${lastEvaluation.depth_score}/10
        - Clarity: ${lastEvaluation.clarity_score}/10
        - Confidence: ${lastEvaluation.confidence_score}/10
        - Answer Type: ${lastEvaluation.answer_type}
        - Mistakes: ${JSON.stringify(lastEvaluation.mistakes || [])}
        - Missing Points: ${JSON.stringify(lastEvaluation.missing_points || [])}
        - Strengths: ${JSON.stringify(lastEvaluation.strengths || [])}

        Your Task:
        Analyze the situation and decide the NEXT QUESTION STRATEGY.

        Consider:
        1. If understanding is shallow → Ask foundational clarifying questions
        2. If understanding is strong → Ask deeper "why", "how", and "trade-off" questions
        3. If mistakes appear → Ask targeted follow-ups on the same concept
        4. If answers are vague → Ask scenario-based or example-driven questions
        5. If performance is strong → Increase difficulty and abstraction level
        6. If performance is weak → Simplify and focus on fundamentals
        7. If confidence is low → Provide supportive but probing questions
        8. If confidence is high but wrong → Challenge with edge cases

        Return JSON only:
        {
          "decision": "increase_difficulty | maintain_difficulty | decrease_difficulty | switch_topic | deepen_probe | clarify_fundamentals | challenge_edge_case | scenario_based",
          "reasoning": "Detailed explanation of why this decision was made",
          "next_difficulty": "easier | same | harder",
          "focus_area": "Which skill/concept to focus on next",
          "question_type": "foundational | deep | follow_up | scenario | trade_off | edge_case",
          "probe_direction": "What aspect to probe: understanding | application | reasoning | trade-offs | edge_cases",
          "should_switch_topic": true/false,
          "should_go_deeper": true/false,
          "adaptation_confidence": 0-10
        }
        `;

        try {
            const result = await generateContentWithFallback(prompt, {
                max_tokens: 800  // Reduced to work within credit limits
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
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const adaptation = JSON.parse(jsonStr);

            return {
                ...adaptation,
                timestamp: new Date(),
                turnNumber
            };
        } catch (error) {
            console.error("Adaptation Block Error:", error);
            // Fallback: Conservative adaptation
            return this._fallbackAdaptation(lastEvaluation, turnNumber);
        }
    }

    /**
     * Build comprehensive context summary for AI reasoning
     */
    _buildContextSummary(cognitiveState, lastEvaluation, turnNumber, recentTurns, roleContext) {
        const {
            performanceTrend,
            currentDifficulty,
            conceptMastery,
            detectedStrengths,
            detectedWeaknesses,
            confidenceTrend,
            clarityTrend,
            learningCurve
        } = cognitiveState;

        const lc = learningCurve || {};
        let summary = `
        Performance Trend: ${performanceTrend}
        Current Difficulty Setting: ${currentDifficulty}
        Learning Curve Slope: ${lc.slope ?? 0} (positive = improving)
        Learning Curve Variance: ${lc.variance ?? 0} (lower = more consistent)
        `;

        if (confidenceTrend && confidenceTrend.length > 0) {
            const avgConfidence = confidenceTrend.reduce((a, b) => a + b, 0) / confidenceTrend.length;
            const trend = confidenceTrend.length >= 2 
                ? (confidenceTrend[confidenceTrend.length - 1] > confidenceTrend[0] ? 'improving' : 'declining')
                : 'stable';
            summary += `\nConfidence: Average ${avgConfidence.toFixed(1)}/10, Trend: ${trend}`;
        }

        if (clarityTrend && clarityTrend.length > 0) {
            const avgClarity = clarityTrend.reduce((a, b) => a + b, 0) / clarityTrend.length;
            summary += `\nClarity: Average ${avgClarity.toFixed(1)}/10`;
        }

        if (detectedStrengths && detectedStrengths.length > 0) {
            summary += `\nDetected Strengths: ${detectedStrengths.map(s => s.concept).join(', ')}`;
        }

        if (detectedWeaknesses && detectedWeaknesses.length > 0) {
            summary += `\nDetected Weaknesses: ${detectedWeaknesses.map(w => w.concept).join(', ')}`;
        }

        if (recentTurns && recentTurns.length > 0) {
            const recentScores = recentTurns.map(t => t.evaluation?.overall_score || 0);
            const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
            summary += `\nRecent Performance (last ${recentTurns.length} turns): Average ${avgRecent.toFixed(1)}/10`;
        }

        return summary;
    }

    /**
     * Fallback adaptation when AI fails
     */
    _fallbackAdaptation(lastEvaluation, turnNumber) {
        const score = lastEvaluation.overall_score || 5;
        
        let decision = 'maintain_difficulty';
        let nextDifficulty = 'same';
        let questionType = 'deep';

        if (score < 4) {
            decision = 'decrease_difficulty';
            nextDifficulty = 'easier';
            questionType = 'foundational';
        } else if (score > 7) {
            decision = 'increase_difficulty';
            nextDifficulty = 'harder';
            questionType = 'trade_off';
        }

        return {
            decision,
            reasoning: `Fallback adaptation based on score ${score}/10`,
            next_difficulty: nextDifficulty,
            focus_area: 'General',
            question_type: questionType,
            probe_direction: 'understanding',
            should_switch_topic: false,
            should_go_deeper: score > 6,
            adaptation_confidence: 5,
            timestamp: new Date(),
            turnNumber
        };
    }
}

module.exports = new AdaptationBlock();
