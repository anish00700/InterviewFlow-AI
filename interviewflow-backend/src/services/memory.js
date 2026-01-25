const Memory = require('../models/Memory');

/**
 * Memory Service - Structured Cognitive State Management
 * 
 * Memory is not just storage. It's structured cognitive state that drives adaptation.
 */
class MemoryService {
    /**
     * Save a complete turn with full cognitive context
     */
    async saveTurn(interviewId, turnNumber, questionData, answerText, evaluationData, adaptationDecision = null) {
        try {
            const memory = new Memory({
                interviewId,
                turnNumber,
                question: {
                    id: questionData.question_id || questionData.id,
                    text: questionData.question_text || questionData.text,
                    skill: questionData.skill_focus || 'General',
                    difficulty: questionData.difficulty || 'Mid',
                    intent: questionData.intent || '',
                    expected_concepts: questionData.expected_concepts || [],
                    reasoning: questionData.reasoning || ''
                },
                answer: answerText,
                evaluation: evaluationData,
                // Store adaptation decision that led to this question
                adaptation: adaptationDecision ? {
                    decision: adaptationDecision.decision,
                    reasoning: adaptationDecision.reasoning,
                    question_type: adaptationDecision.question_type
                } : null
            });

            await memory.save();
            return memory;
        } catch (error) {
            console.error("MemoryService Error:", error);
            throw error;
        }
    }

    async getHistory(interviewId) {
        return await Memory.find({ interviewId }).sort({ turnNumber: 1 });
    }

    async getWeakAreas(interviewId) {
        // Heuristic: Skills where average score < 6
        const history = await this.getHistory(interviewId);
        const skillScores = {};

        history.forEach(turn => {
            const skill = turn.question.skill;
            const score = turn.evaluation.overall_score || 0;
            if (!skillScores[skill]) skillScores[skill] = { total: 0, count: 0 };
            skillScores[skill].total += score;
            skillScores[skill].count += 1;
        });

        const weakAreas = [];
        for (const [skill, stats] of Object.entries(skillScores)) {
            if (stats.total / stats.count < 6) weakAreas.push(skill);
        }
        return weakAreas;
    }

    async getStrongAreas(interviewId) {
        // Heuristic: Skills where average score > 8
        const history = await this.getHistory(interviewId);
        const skillScores = {};

        history.forEach(turn => {
            const skill = turn.question.skill;
            const score = turn.evaluation.overall_score || 0;
            if (!skillScores[skill]) skillScores[skill] = { total: 0, count: 0 };
            skillScores[skill].total += score;
            skillScores[skill].count += 1;
        });

        const strongAreas = [];
        for (const [skill, stats] of Object.entries(skillScores)) {
            if (stats.total / stats.count > 8) strongAreas.push(skill);
        }
        return strongAreas;
    }

    /**
     * Get recent turns for trend analysis
     */
    async getRecentTurns(interviewId, count = 5) {
        const history = await this.getHistory(interviewId);
        return history.slice(-count);
    }

    /**
     * Extract all concepts tested across history
     */
    async getTestedConcepts(interviewId) {
        const history = await this.getHistory(interviewId);
        const conceptMap = {};

        history.forEach(turn => {
            const concepts = turn.question?.expected_concepts || [];
            const score = turn.evaluation?.overall_score || 0;

            concepts.forEach(concept => {
                if (!conceptMap[concept]) {
                    conceptMap[concept] = {
                        scores: [],
                        turns: []
                    };
                }
                conceptMap[concept].scores.push(score);
                conceptMap[concept].turns.push(turn.turnNumber);
            });
        });

        // Compute averages
        const concepts = {};
        Object.entries(conceptMap).forEach(([concept, data]) => {
            const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
            concepts[concept] = {
                averageScore: avg,
                turnCount: data.turns.length,
                turns: data.turns
            };
        });

        return concepts;
    }

    /**
     * Get performance trends
     */
    async getPerformanceTrends(interviewId) {
        const history = await this.getHistory(interviewId);
        
        const trends = {
            overall: history.map(t => t.evaluation?.overall_score || 0),
            relevance: history.map(t => t.evaluation?.relevance_score || 0),
            correctness: history.map(t => t.evaluation?.correctness_score || 0),
            depth: history.map(t => t.evaluation?.depth_score || 0),
            clarity: history.map(t => t.evaluation?.clarity_score || 0),
            confidence: history.map(t => t.evaluation?.confidence_score || 0)
        };

        return trends;
    }
}

module.exports = new MemoryService();
