/**
 * Analytics Block - Scoring & Metrics Engine
 * 
 * This block computes:
 * - Per-dimension scores (relevance, correctness, depth, clarity, confidence, reasoning)
 * - Per-skill aggregate scores
 * - Consistency metrics
 * - Learning curve analysis
 * - Communication effectiveness
 * - Concept mastery levels
 * - Performance progression
 * 
 * All scores are normalized against role level expectations.
 */
class AnalyticsBlock {
    /**
     * Compute comprehensive analytics from interview history
     * 
     * @param {Array} history - Array of memory turns with evaluations
     * @param {Object} roleContext - Role, level, skills
     * @returns {Object} Comprehensive analytics
     */
    computeAnalytics(history, roleContext) {
        if (!history || history.length === 0) {
            return this._emptyAnalytics();
        }

        const {
            dimensionScores,
            skillScores,
            consistencyScore,
            learningCurve,
            communicationProfile,
            reasoningQuality
        } = this._computeDimensionScores(history);
        
        const conceptMastery = this._computeConceptMastery(history);
        const performanceProgression = this._computePerformanceProgression(history);
        const trendAnalysis = this._analyzeTrends(history);

        return {
            // Dimension scores (0-10 scale)
            dimensionScores: {
                relevance: dimensionScores.relevance,
                correctness: dimensionScores.correctness,
                depth: dimensionScores.depth,
                clarity: dimensionScores.clarity,
                confidence: dimensionScores.confidence,
                reasoning: dimensionScores.reasoning,
                overall: dimensionScores.overall
            },

            // Per-skill aggregates
            skillScores: skillScores,

            // Consistency metrics
            consistency: {
                score: consistencyScore,
                variance: this._computeVariance(history.map(t => t.evaluation?.overall_score || 0)),
                stability: this._computeStability(history)
            },

            // Learning curve
            learningCurve: {
                slope: learningCurve.slope,
                variance: learningCurve.variance,
                cognitiveLoad: learningCurve.cognitiveLoad,
                trend: learningCurve.trend
            },

            // Communication profile
            communication: {
                clarity: communicationProfile.clarity,
                structure: communicationProfile.structure,
                completeness: communicationProfile.completeness,
                consistency: communicationProfile.consistency,
                effectiveness: (communicationProfile.clarity + communicationProfile.structure + communicationProfile.completeness) / 3
            },

            // Reasoning quality
            reasoning: {
                average: reasoningQuality.average,
                trend: reasoningQuality.trend,
                depth: this._computeReasoningDepth(history)
            },

            // Concept mastery map
            conceptMastery: conceptMastery,

            // Performance progression
            progression: {
                trajectory: performanceProgression.trajectory,
                improvementRate: performanceProgression.improvementRate,
                peakPerformance: performanceProgression.peakPerformance,
                lowPerformance: performanceProgression.lowPerformance
            },

            // Trend analysis
            trends: {
                performance: trendAnalysis.performance,
                confidence: trendAnalysis.confidence,
                clarity: trendAnalysis.clarity,
                depth: trendAnalysis.depth
            },

            // Normalized scores (against role level)
            normalizedScores: this._normalizeScores(dimensionScores, roleContext),

            // Summary statistics
            summary: {
                totalTurns: history.length,
                averageScore: dimensionScores.overall,
                bestTurn: this._findBestTurn(history),
                worstTurn: this._findWorstTurn(history),
                scoreDistribution: this._computeScoreDistribution(history)
            }
        };
    }

    /**
     * Compute per-dimension scores from history
     */
    _computeDimensionScores(history) {
        const scores = {
            relevance: [],
            correctness: [],
            depth: [],
            clarity: [],
            confidence: [],
            reasoning: [],
            overall: []
        };

        history.forEach(turn => {
            const evaluation = turn.evaluation || {};
            if (evaluation.relevance_score !== undefined) scores.relevance.push(evaluation.relevance_score);
            if (evaluation.correctness_score !== undefined) scores.correctness.push(evaluation.correctness_score);
            if (evaluation.depth_score !== undefined) scores.depth.push(evaluation.depth_score);
            if (evaluation.clarity_score !== undefined) scores.clarity.push(evaluation.clarity_score);
            if (evaluation.confidence_score !== undefined) scores.confidence.push(evaluation.confidence_score);
            if (evaluation.overall_score !== undefined) scores.overall.push(evaluation.overall_score);
        });

        // Compute averages
        const dimensionScores = {
            relevance: this._average(scores.relevance),
            correctness: this._average(scores.correctness),
            depth: this._average(scores.depth),
            clarity: this._average(scores.clarity),
            confidence: this._average(scores.confidence),
            reasoning: this._average(scores.reasoning),
            overall: this._average(scores.overall)
        };

        // Skill scores
        const skillScores = this._computeSkillScores(history);

        // Consistency (inverse of variance)
        const consistencyScore = 10 - Math.min(10, this._computeVariance(scores.overall) * 2);

        // Learning curve
        const learningCurve = this._computeLearningCurve(scores.overall);

        // Communication profile
        const communicationProfile = {
            clarity: dimensionScores.clarity,
            structure: this._computeStructureScore(history),
            completeness: this._computeCompletenessScore(history),
            consistency: consistencyScore / 10
        };

        // Reasoning quality
        const reasoningQuality = {
            average: dimensionScores.reasoning || dimensionScores.depth,
            trend: this._computeTrend(scores.reasoning.length > 0 ? scores.reasoning : scores.depth)
        };

        return {
            dimensionScores,
            skillScores,
            consistencyScore,
            learningCurve,
            communicationProfile,
            reasoningQuality
        };
    }

    /**
     * Compute per-skill aggregate scores
     */
    _computeSkillScores(history) {
        const skillMap = {};

        history.forEach(turn => {
            const skill = turn.question?.skill || 'General';
            const score = turn.evaluation?.overall_score || 0;

            if (!skillMap[skill]) {
                skillMap[skill] = {
                    scores: [],
                    turnCount: 0
                };
            }

            skillMap[skill].scores.push(score);
            skillMap[skill].turnCount++;
        });

        const skillScores = {};
        Object.entries(skillMap).forEach(([skill, data]) => {
            const scores = data.scores;
            skillScores[skill] = {
                averageScore: this._average(scores),
                turnCount: data.turnCount,
                trend: this._computeTrend(scores),
                min: Math.min(...scores),
                max: Math.max(...scores)
            };
        });

        return skillScores;
    }

    /**
     * Compute concept mastery map
     */
    _computeConceptMastery(history) {
        const conceptMap = {};

        history.forEach(turn => {
            const concepts = turn.question?.expected_concepts || [];
            const score = turn.evaluation?.overall_score || 0;

            concepts.forEach(concept => {
                if (!conceptMap[concept]) {
                    conceptMap[concept] = [];
                }
                conceptMap[concept].push(score);
            });
        });

        const mastery = {};
        Object.entries(conceptMap).forEach(([concept, scores]) => {
            mastery[concept] = this._average(scores);
        });

        return mastery;
    }

    /**
     * Compute performance progression
     */
    _computePerformanceProgression(history) {
        const scores = history.map(t => t.evaluation?.overall_score || 0);
        
        if (scores.length < 2) {
            return {
                trajectory: 'stable',
                improvementRate: 0,
                peakPerformance: scores[0] || 0,
                lowPerformance: scores[0] || 0
            };
        }

        // Simple linear regression for trend
        const n = scores.length;
        const x = Array.from({ length: n }, (_, i) => i + 1);
        const y = scores;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const improvementRate = slope;

        let trajectory = 'stable';
        if (slope > 0.2) trajectory = 'improving';
        else if (slope < -0.2) trajectory = 'declining';
        else if (this._computeVariance(scores) > 2) trajectory = 'volatile';

        return {
            trajectory,
            improvementRate,
            peakPerformance: Math.max(...scores),
            lowPerformance: Math.min(...scores)
        };
    }

    /**
     * Analyze trends across dimensions
     */
    _analyzeTrends(history) {
        const performance = history.map(t => t.evaluation?.overall_score || 0);
        const confidence = history.map(t => t.evaluation?.confidence_score || 0);
        const clarity = history.map(t => t.evaluation?.clarity_score || 0);
        const depth = history.map(t => t.evaluation?.depth_score || 0);

        return {
            performance: this._computeTrend(performance),
            confidence: this._computeTrend(confidence),
            clarity: this._computeTrend(clarity),
            depth: this._computeTrend(depth)
        };
    }

    /**
     * Compute learning curve metrics
     */
    _computeLearningCurve(scores) {
        if (scores.length < 2) {
            return {
                slope: 0,
                variance: 0,
                cognitiveLoad: 0,
                trend: 'stable'
            };
        }

        // Compute slope (improvement rate)
        const n = scores.length;
        const x = Array.from({ length: n }, (_, i) => i + 1);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = scores.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * scores[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        // Variance (consistency)
        const variance = this._computeVariance(scores);

        // Cognitive load (how well candidate handles increasing complexity)
        // Approximated by variance in later turns vs early turns
        const earlyAvg = this._average(scores.slice(0, Math.ceil(n / 2)));
        const lateAvg = this._average(scores.slice(Math.floor(n / 2)));
        const cognitiveLoad = Math.abs(lateAvg - earlyAvg) < 1 ? 10 : Math.max(0, 10 - Math.abs(lateAvg - earlyAvg));

        let trend = 'stable';
        if (slope > 0.1) trend = 'improving';
        else if (slope < -0.1) trend = 'declining';
        else if (variance > 2) trend = 'volatile';

        return {
            slope,
            variance,
            cognitiveLoad,
            trend
        };
    }

    /**
     * Normalize scores against role level expectations
     */
    _normalizeScores(dimensionScores, roleContext) {
        const { experienceLevel } = roleContext;
        
        // Expected scores by level (baseline expectations)
        const expectations = {
            'Intern': { overall: 5, depth: 4, reasoning: 4 },
            'Junior': { overall: 6, depth: 5, reasoning: 5 },
            'Mid-Level': { overall: 7, depth: 6, reasoning: 6 },
            'Senior': { overall: 8, depth: 7, reasoning: 7 },
            'Staff+': { overall: 9, depth: 8, reasoning: 8 }
        };

        const expected = expectations[experienceLevel] || expectations['Mid-Level'];

        return {
            overall: (dimensionScores.overall / expected.overall) * 10,
            depth: (dimensionScores.depth / expected.depth) * 10,
            reasoning: (dimensionScores.reasoning / expected.reasoning) * 10,
            normalizedOverall: Math.min(10, (dimensionScores.overall / expected.overall) * 10)
        };
    }

    // Helper methods
    _average(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    _computeVariance(arr) {
        if (arr.length < 2) return 0;
        const avg = this._average(arr);
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
        return Math.sqrt(variance); // Standard deviation
    }

    _computeTrend(scores) {
        if (scores.length < 2) return 'stable';
        const firstHalf = this._average(scores.slice(0, Math.ceil(scores.length / 2)));
        const secondHalf = this._average(scores.slice(Math.floor(scores.length / 2)));
        const diff = secondHalf - firstHalf;
        if (diff > 0.5) return 'improving';
        if (diff < -0.5) return 'declining';
        return 'stable';
    }

    _computeStability(history) {
        const scores = history.map(t => t.evaluation?.overall_score || 0);
        const variance = this._computeVariance(scores);
        return Math.max(0, 10 - variance * 2); // Higher variance = lower stability
    }

    _computeStructureScore(history) {
        // Approximate structure from clarity and completeness
        const clarityScores = history.map(t => t.evaluation?.clarity_score || 0);
        return this._average(clarityScores);
    }

    _computeCompletenessScore(history) {
        // Approximate from missing_points count
        const completeness = history.map(t => {
            const missing = t.evaluation?.missing_points?.length || 0;
            return Math.max(0, 10 - missing * 2); // Fewer missing = higher completeness
        });
        return this._average(completeness);
    }

    _computeReasoningDepth(history) {
        const depthScores = history.map(t => t.evaluation?.depth_score || 0);
        return this._average(depthScores);
    }

    _findBestTurn(history) {
        if (history.length === 0) return null;
        let best = history[0];
        history.forEach(turn => {
            if ((turn.evaluation?.overall_score || 0) > (best.evaluation?.overall_score || 0)) {
                best = turn;
            }
        });
        return {
            turn: best.turnNumber,
            score: best.evaluation?.overall_score || 0
        };
    }

    _findWorstTurn(history) {
        if (history.length === 0) return null;
        let worst = history[0];
        history.forEach(turn => {
            if ((turn.evaluation?.overall_score || 0) < (worst.evaluation?.overall_score || 0)) {
                worst = turn;
            }
        });
        return {
            turn: worst.turnNumber,
            score: worst.evaluation?.overall_score || 0
        };
    }

    _computeScoreDistribution(history) {
        const scores = history.map(t => t.evaluation?.overall_score || 0);
        return {
            excellent: scores.filter(s => s >= 8).length,
            good: scores.filter(s => s >= 6 && s < 8).length,
            average: scores.filter(s => s >= 4 && s < 6).length,
            poor: scores.filter(s => s < 4).length
        };
    }

    _emptyAnalytics() {
        return {
            dimensionScores: {
                relevance: 0, correctness: 0, depth: 0, clarity: 0,
                confidence: 0, reasoning: 0, overall: 0
            },
            skillScores: {},
            consistency: { score: 0, variance: 0, stability: 0 },
            learningCurve: { slope: 0, variance: 0, cognitiveLoad: 0, trend: 'stable' },
            communication: { clarity: 0, structure: 0, completeness: 0, consistency: 0, effectiveness: 0 },
            reasoning: { average: 0, trend: 'stable', depth: 0 },
            conceptMastery: {},
            progression: { trajectory: 'stable', improvementRate: 0, peakPerformance: 0, lowPerformance: 0 },
            trends: { performance: 'stable', confidence: 'stable', clarity: 'stable', depth: 'stable' },
            normalizedScores: { overall: 0, depth: 0, reasoning: 0, normalizedOverall: 0 },
            summary: { totalTurns: 0, averageScore: 0, bestTurn: null, worstTurn: null, scoreDistribution: {} }
        };
    }
}

module.exports = new AnalyticsBlock();
