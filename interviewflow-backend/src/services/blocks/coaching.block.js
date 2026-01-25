const { generateContentWithFallback } = require('../../config/github-models-helper');

/**
 * Coaching Block - Personalized Improvement Engine
 * 
 * Generates actionable, targeted coaching based on:
 * - Observed patterns (not single answers)
 * - Concept mastery gaps
 * - Communication weaknesses
 * - Reasoning quality issues
 * - Specific mistakes and misconceptions
 * 
 * Coaching must be:
 * - Specific (not generic)
 * - Targeted (addresses actual gaps)
 * - Actionable (clear next steps)
 * - Prioritized (most critical first)
 * - Explainable (why this matters)
 */
class CoachingBlock {
    /**
     * Generate personalized coaching plan
     * 
     * @param {Object} analytics - Analytics from analytics block
     * @param {Array} history - Full interview history
     * @param {Object} roleContext - Role, level, skills
     * @returns {Object} Comprehensive coaching plan
     */
    async generateCoachingPlan(analytics, history, roleContext) {
        const {
            dimensionScores,
            skillScores,
            conceptMastery,
            detectedWeaknesses,
            communication,
            reasoning
        } = analytics;

        // Build coaching context
        const coachingContext = this._buildCoachingContext(
            analytics,
            history,
            roleContext
        );

        const prompt = `
        You are an expert technical coach and mentor.
        Your goal is to generate a personalized, actionable improvement plan based on interview performance.

        Interview Context:
        Role: ${roleContext.role}
        Experience Level: ${roleContext.experienceLevel}
        Skills Tested: ${roleContext.skills.join(', ')}

        Performance Analysis:
        ${coachingContext}

        Your Task:
        Generate a comprehensive, personalized coaching plan that:

        1. Identifies the MOST CRITICAL gaps (not all gaps, focus on what matters most)
        2. Explains WHY each gap matters for the role
        3. Provides SPECIFIC, ACTIONABLE steps to improve
        4. Prioritizes improvements (what to work on first, second, third)
        5. Suggests PRACTICE STRATEGIES (not just "study more")
        6. Recommends SPECIFIC RESOURCES or problem types
        7. Sets REALISTIC expectations for improvement timeline

        Focus on:
        - Patterns observed across multiple answers (not single mistakes)
        - Fundamental concept gaps (not surface-level issues)
        - Communication and reasoning quality
        - Role-specific expectations

        Return JSON only:
        {
          "critical_gaps": [
            {
              "concept": "Concept name",
              "severity": "high | medium | low",
              "evidence": ["Specific examples from interview"],
              "why_it_matters": "Why this gap is critical for the role",
              "impact": "What this gap prevents the candidate from doing"
            }
          ],
          "improvement_roadmap": [
            {
              "priority": 1-10,
              "focus_area": "What to improve",
              "specific_steps": [
                "Step 1: ...",
                "Step 2: ...",
                "Step 3: ..."
              ],
              "practice_strategy": "How to practice this",
              "resources": ["Resource 1", "Resource 2"],
              "timeline": "Expected time to see improvement",
              "success_metrics": "How to know you've improved"
            }
          ],
          "strengths_to_leverage": [
            {
              "strength": "What they're good at",
              "how_to_use": "How to leverage this in interviews/job"
            }
          ],
          "communication_coaching": {
            "issues": ["Issue 1", "Issue 2"],
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "practice_exercises": ["Exercise 1", "Exercise 2"]
          },
          "reasoning_coaching": {
            "issues": ["Issue 1", "Issue 2"],
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "practice_exercises": ["Exercise 1", "Exercise 2"]
          },
          "study_plan": {
            "week_1_2": ["Focus areas"],
            "week_3_4": ["Focus areas"],
            "month_2": ["Focus areas"],
            "ongoing": ["Focus areas"]
          }
        }
        `;

        try {
            const result = await generateContentWithFallback(prompt, {
                max_tokens: 1200  // Reduced to work within credit limits
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
            const coaching = JSON.parse(jsonStr);

            return coaching;
        } catch (error) {
            console.error("Coaching Block Error:", error);
            return this._fallbackCoaching(analytics, history);
        }
    }

    /**
     * Build comprehensive coaching context
     */
    _buildCoachingContext(analytics, history, roleContext) {
        let context = `
        Overall Performance:
        - Average Score: ${analytics.dimensionScores.overall.toFixed(1)}/10
        - Relevance: ${analytics.dimensionScores.relevance.toFixed(1)}/10
        - Correctness: ${analytics.dimensionScores.correctness.toFixed(1)}/10
        - Depth: ${analytics.dimensionScores.depth.toFixed(1)}/10
        - Clarity: ${analytics.dimensionScores.clarity.toFixed(1)}/10
        - Confidence: ${analytics.dimensionScores.confidence.toFixed(1)}/10
        - Reasoning: ${analytics.dimensionScores.reasoning.toFixed(1)}/10

        Performance Trends:
        - Trajectory: ${analytics.progression.trajectory}
        - Consistency: ${analytics.consistency.score.toFixed(1)}/10
        - Learning Curve: ${analytics.learningCurve.trend}
        `;

        // Skill breakdown
        if (Object.keys(analytics.skillScores).length > 0) {
            context += `\n\nSkill Performance:\n`;
            Object.entries(analytics.skillScores).forEach(([skill, data]) => {
                context += `- ${skill}: ${data.averageScore.toFixed(1)}/10 (${data.turnCount} questions, trend: ${data.trend})\n`;
            });
        }

        // Concept mastery
        if (Object.keys(analytics.conceptMastery).length > 0) {
            context += `\n\nConcept Mastery:\n`;
            Object.entries(analytics.conceptMastery)
                .sort((a, b) => a[1] - b[1]) // Sort by mastery (lowest first)
                .slice(0, 10) // Top 10 weakest
                .forEach(([concept, mastery]) => {
                    context += `- ${concept}: ${mastery.toFixed(1)}/10\n`;
                });
        }

        // Communication profile
        context += `\n\nCommunication Profile:
        - Clarity: ${analytics.communication.clarity.toFixed(1)}/10
        - Structure: ${analytics.communication.structure.toFixed(1)}/10
        - Completeness: ${analytics.communication.completeness.toFixed(1)}/10
        - Consistency: ${analytics.communication.consistency.toFixed(1)}/10
        - Overall Effectiveness: ${analytics.communication.effectiveness.toFixed(1)}/10
        `;

        // Reasoning quality
        context += `\n\nReasoning Quality:
        - Average: ${analytics.reasoning.average.toFixed(1)}/10
        - Trend: ${analytics.reasoning.trend}
        - Depth: ${analytics.reasoning.depth.toFixed(1)}/10
        `;

        // Specific mistakes and patterns
        const allMistakes = [];
        const allMissingPoints = [];
        history.forEach(turn => {
            const evaluation = turn.evaluation || {};
            if (evaluation.mistakes) allMistakes.push(...evaluation.mistakes);
            if (evaluation.missing_points) allMissingPoints.push(...evaluation.missing_points);
        });

        if (allMistakes.length > 0) {
            context += `\n\nCommon Mistakes Observed:\n`;
            const mistakeCounts = {};
            allMistakes.forEach(m => {
                mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
            });
            Object.entries(mistakeCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([mistake, count]) => {
                    context += `- ${mistake} (appeared ${count} times)\n`;
                });
        }

        if (allMissingPoints.length > 0) {
            context += `\n\nFrequently Missing Concepts:\n`;
            const missingCounts = {};
            allMissingPoints.forEach(m => {
                missingCounts[m] = (missingCounts[m] || 0) + 1;
            });
            Object.entries(missingCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([concept, count]) => {
                    context += `- ${concept} (missing ${count} times)\n`;
                });
        }

        return context;
    }

    /**
     * Fallback coaching when AI fails
     */
    _fallbackCoaching(analytics, history) {
        const gaps = [];
        const roadmap = [];

        // Identify weak dimensions
        const { dimensionScores } = analytics;
        if (dimensionScores.depth < 6) {
            gaps.push({
                concept: 'Technical Depth',
                severity: 'high',
                evidence: ['Low depth scores across multiple questions'],
                why_it_matters: 'Shows lack of deep understanding',
                impact: 'Cannot handle complex problems'
            });
            roadmap.push({
                priority: 1,
                focus_area: 'Build deeper technical understanding',
                specific_steps: [
                    'Study system internals and design principles',
                    'Practice explaining "why" and "how", not just "what"',
                    'Work on trade-off analysis'
                ],
                practice_strategy: 'Focus on deep-dive questions and system design',
                resources: ['System Design Interview books', 'Technical deep-dive articles'],
                timeline: '2-4 weeks',
                success_metrics: 'Can explain internals and trade-offs'
            });
        }

        if (dimensionScores.clarity < 6) {
            gaps.push({
                concept: 'Communication Clarity',
                severity: 'medium',
                evidence: ['Low clarity scores'],
                why_it_matters: 'Important for collaboration',
                impact: 'Difficult to communicate ideas'
            });
            roadmap.push({
                priority: 2,
                focus_area: 'Improve communication clarity',
                specific_steps: [
                    'Practice structured explanations (problem, approach, solution)',
                    'Record yourself explaining concepts',
                    'Get feedback on clarity'
                ],
                practice_strategy: 'Practice explaining technical concepts to non-technical people',
                resources: ['Communication skills courses'],
                timeline: '1-2 weeks',
                success_metrics: 'Can explain clearly and concisely'
            });
        }

        return {
            critical_gaps: gaps,
            improvement_roadmap: roadmap,
            strengths_to_leverage: [],
            communication_coaching: {
                issues: dimensionScores.clarity < 6 ? ['Low clarity in explanations'] : [],
                recommendations: ['Practice structured thinking', 'Use frameworks for explanations'],
                practice_exercises: ['Explain concepts to peers', 'Record and review explanations']
            },
            reasoning_coaching: {
                issues: dimensionScores.reasoning < 6 ? ['Weak reasoning quality'] : [],
                recommendations: ['Practice explaining thought process', 'Work on problem-solving frameworks'],
                practice_exercises: ['Solve problems out loud', 'Explain your approach step-by-step']
            },
            study_plan: {
                week_1_2: ['Focus on weakest areas'],
                week_3_4: ['Build on improvements'],
                month_2: ['Advanced topics'],
                ongoing: ['Continuous practice']
            }
        };
    }
}

module.exports = new CoachingBlock();
