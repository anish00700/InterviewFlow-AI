const Interview = require('../models/Interview');
const questionBlock = require('./blocks/question.block');
const evaluationBlock = require('./blocks/evaluation.block');
const adaptationBlock = require('./blocks/adaptation.block');
const analyticsBlock = require('./blocks/analytics.block');
const coachingBlock = require('./blocks/coaching.block');
const memoryService = require('./memory');
const reportService = require('./report');

/**
 * Interview Service - Core Orchestration Engine
 * 
 * This service orchestrates the entire adaptive interview pipeline:
 * Role → Context → Question Generation → Memory → Evaluation → Analytics → Adaptation → Final Report
 * 
 * Each block operates independently but shares state through the central Interview State object.
 */
class InterviewService {
    /**
     * Start a new interview session
     * Initializes the cognitive state and generates the first question
     */
    async startInterview(settings, userId = null) {
        const { skills, difficulty, duration, role } = settings;

        // Determine experience level from difficulty
        const experienceLevel = this._mapDifficultyToLevel(difficulty);

        // Calculate maximum questions based on duration
        const maxQuestions = this._calculateMaxQuestions(duration);

        // 1. Initialize Cognitive State
        const cognitiveState = {
            currentDifficulty: 'same',
            performanceTrend: 'stable',
            conceptMastery: new Map(),
            confidenceTrend: [],
            clarityTrend: [],
            detectedStrengths: [],
            detectedWeaknesses: [],
            communicationProfile: {
                clarity: 0,
                structure: 0,
                completeness: 0,
                consistency: 0
            },
            reasoningQuality: {
                average: 0,
                trend: 'stable'
            },
            learningCurve: {
                slope: 0,
                variance: 0,
                cognitiveLoad: 0,
                trend: 'stable'
            }
        };

        // 2. Build Context for Question Generation
        // Use experienceLevel (mapped from difficulty) for proper difficulty scaling
        const context = {
            role: role || 'Software Engineer',
            skill: skills[0] || 'General',
            level: experienceLevel, // Use mapped experience level for proper difficulty
            previousQuestions: [],
            weakAreas: [],
            strongAreas: []
        };

        // 3. Generate First Question (no adaptation needed yet)
        const firstQuestion = await questionBlock.generateNextQuestion(context);

        // 4. Create Interview State Document
        const interview = new Interview({
            userId,
            role: role || 'Software Engineer',
            targetPosition: role || 'Software Engineer',
            experienceLevel,
            status: 'active',
            settings: {
                skills,
                difficulty,
                duration,
                role: role || 'Software Engineer',
                maxQuestions // Store max questions for this interview
            },
            context: {
                weakAreas: [],
                strongAreas: [],
                previousQuestions: [],
                testedConcepts: []
            },
            cognitiveState,
            currentQuestionIndex: 1,
            totalTurns: 0,
            currentQuestion: firstQuestion,
            dimensionScores: {
                relevance: 0,
                correctness: 0,
                depth: 0,
                clarity: 0,
                confidence: 0,
                reasoning: 0
            },
            skillScores: new Map(),
            consistencyScore: 0,
            adaptationHistory: []
        });

        await interview.save();

        return {
            id: interview._id,
            status: interview.status,
            startedAt: interview.startedAt,
            settings: {
                ...settings,
                maxQuestions
            },
            currentQuestion: firstQuestion,
            maxQuestions // Return to frontend
        };
    }

    /**
     * Process an answer - The Core Adaptive Loop
     * 
     * This is where the magic happens:
     * 1. Evaluate the answer
     * 2. Save to memory
     * 3. Update cognitive state
     * 4. Compute analytics
     * 5. Decide adaptation strategy
     * 6. Generate next question based on adaptation
     */
    async processAnswer(interviewId, answerText, questionId) {
        // 1. Fetch Interview State
        const interview = await Interview.findById(interviewId);
        if (!interview || interview.status !== 'active') {
            throw new Error("Interview not found or inactive");
        }

        const currentQ = interview.currentQuestion || {
            id: questionId,
            text: "Question text missing from session state",
            skill_focus: interview.settings.skills[0],
            difficulty: interview.settings.difficulty
        };

        const { settings, context, cognitiveState } = interview;
        const turnNumber = interview.totalTurns + 1;

        // 2. Evaluate Answer (Multi-dimensional analysis)
        let evaluation;
        try {
            evaluation = await evaluationBlock.evaluateAnswer({
                question: currentQ,
                answer: answerText,
                role: settings.role || interview.role,
                skill: currentQ.skill_focus || context.skill || settings.skills[0],
                level: settings.difficulty || interview.experienceLevel
            });
        } catch (error) {
            console.error("Evaluation failed in interview service:", error);
            // If evaluation completely fails, use a basic fallback
            evaluation = {
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
                improvement_feedback: [`Evaluation error: ${error.message}`],
                next_question_difficulty: "same",
                suggested_followup_question: "",
                interviewer_commentary: `Unable to evaluate answer: ${error.message}. Please check your API configuration.`
            };
        }

        // 3. Get Recent History for Trend Analysis
        const history = await memoryService.getHistory(interviewId);
        const recentTurns = history.slice(-3); // Last 3 turns for trend

        // 4. Save Turn to Memory (with adaptation context if available)
        await memoryService.saveTurn(
            interviewId,
            turnNumber,
            currentQ,
            answerText,
            evaluation,
            null // Will be updated after adaptation
        );

        // 5. Update Cognitive State
        this._updateCognitiveState(interview, evaluation, turnNumber);

        // 6. Compute Analytics
        const fullHistory = await memoryService.getHistory(interviewId);
        const analytics = analyticsBlock.computeAnalytics(fullHistory, {
            role: interview.role,
            experienceLevel: interview.experienceLevel,
            skills: settings.skills
        });

        // 7. Update Interview with Analytics
        interview.dimensionScores = {
            relevance: analytics.dimensionScores.relevance,
            correctness: analytics.dimensionScores.correctness,
            depth: analytics.dimensionScores.depth,
            clarity: analytics.dimensionScores.clarity,
            confidence: analytics.dimensionScores.confidence,
            reasoning: analytics.dimensionScores.reasoning
        };

        // Update skill scores
        Object.entries(analytics.skillScores).forEach(([skill, data]) => {
            interview.skillScores.set(skill, {
                averageScore: data.averageScore,
                turnCount: data.turnCount,
                trend: data.trend
            });
        });

        interview.consistencyScore = analytics.consistency.score;

        // 8. Adaptive Control Logic - Decide Next Strategy
        const roleContext = {
            role: interview.role,
            experienceLevel: interview.experienceLevel,
            skills: settings.skills
        };

        const adaptationDecision = await adaptationBlock.decideNextStrategy(
            interview.cognitiveState,
            evaluation,
            turnNumber,
            recentTurns,
            roleContext
        );

        // 9. Update Cognitive State with Adaptation Decision
        interview.cognitiveState.currentDifficulty = adaptationDecision.next_difficulty;
        interview.adaptationHistory.push({
            turn: turnNumber,
            decision: adaptationDecision.decision,
            reason: adaptationDecision.reasoning,
            previousScore: evaluation.overall_score,
            newDifficulty: adaptationDecision.next_difficulty
        });

        // 10. Determine which skill to focus on (rotate through skills if multiple)
        let skillToFocus = adaptationDecision.focus_area || settings.skills[0];
        
        // If multiple skills, rotate through them to ensure coverage
        if (settings.skills.length > 1) {
            const skillHistory = fullHistory.map(t => t.question?.skill || t.question?.skill_focus);
            const skillCounts = {};
            settings.skills.forEach(skill => {
                skillCounts[skill] = skillHistory.filter(s => s === skill).length;
            });
            
            // Find the skill with least questions asked
            const leastAskedSkill = Object.entries(skillCounts)
                .sort((a, b) => a[1] - b[1])[0][0];
            
            // Use least asked skill unless adaptation specifically wants a different focus
            if (!adaptationDecision.focus_area || adaptationDecision.should_switch_topic) {
                skillToFocus = leastAskedSkill;
            }
        }

        // 11. Generate Next Question (with adaptation strategy)
        const nextQ = await questionBlock.generateNextQuestion(
            {
                role: interview.role,
                skill: skillToFocus,
                level: interview.experienceLevel,
                previousQuestions: interview.context.previousQuestions,
                weakAreas: interview.context.weakAreas,
                strongAreas: interview.context.strongAreas,
                allSkills: settings.skills, // Pass all skills for context
                turnNumber: turnNumber // Pass turn number for variety
            },
            adaptationDecision,
            interview.cognitiveState
        );

        // 11. Update Context
        if (evaluation.overall_score < 6) {
            if (!interview.context.weakAreas.includes(currentQ.skill_focus || settings.skills[0])) {
                interview.context.weakAreas.push(currentQ.skill_focus || settings.skills[0]);
            }
        } else if (evaluation.overall_score > 8) {
            if (!interview.context.strongAreas.includes(currentQ.skill_focus || settings.skills[0])) {
                interview.context.strongAreas.push(currentQ.skill_focus || settings.skills[0]);
            }
        }

        interview.context.previousQuestions.push(currentQ.question_text || currentQ.text);

        // Update tested concepts
        const concepts = currentQ.expected_concepts || [];
        concepts.forEach(concept => {
            const existing = interview.context.testedConcepts.find(c => c.concept === concept);
            if (existing) {
                existing.turns.push(turnNumber);
                // Recompute average
                const conceptHistory = fullHistory.filter(t => 
                    t.question?.expected_concepts?.includes(concept)
                );
                existing.averageScore = conceptHistory.reduce((sum, t) => 
                    sum + (t.evaluation?.overall_score || 0), 0
                ) / conceptHistory.length;
            } else {
                interview.context.testedConcepts.push({
                    concept,
                    turns: [turnNumber],
                    averageScore: evaluation.overall_score
                });
            }
        });

        // 12. Check if we've reached the question limit
        const maxQuestions = interview.settings.maxQuestions || this._calculateMaxQuestions(interview.settings.duration);
        const isComplete = turnNumber >= maxQuestions;

        // 13. Update Interview State
        interview.currentQuestion = isComplete ? null : nextQ; // Don't set next question if complete
        interview.currentQuestionIndex += 1;
        interview.totalTurns = turnNumber;
        interview.lastActivityAt = new Date();
        
        if (isComplete) {
            interview.status = 'completed';
        }

        await interview.save();

        // 14. Return Response
        // Map scores to frontend format (0-100 scale)
        return {
            questionId: currentQ.question_id || questionId,
            scores: {
                clarity: Math.round(evaluation.clarity_score * 10), // 0-100
                coherence: Math.round(evaluation.relevance_score * 10), // Map relevance to coherence
                depth: Math.round(evaluation.depth_score * 10), // 0-100
                communication: Math.round(evaluation.confidence_score * 10), // Map confidence to communication
                overall: Math.round(evaluation.overall_score * 10), // 0-100
                // Keep detailed scores for analytics
                relevance: Math.round(evaluation.relevance_score * 10),
                correctness: Math.round(evaluation.correctness_score * 10),
                confidence: Math.round(evaluation.confidence_score * 10),
                reasoning: Math.round(evaluation.depth_score * 10)
            },
            feedback: evaluation.interviewer_commentary,
            suggestions: [
                ...(evaluation.improvement_feedback || []),
                evaluation.suggested_followup_question ? `Follow-up: ${evaluation.suggested_followup_question}` : null
            ].filter(Boolean),
            detailed_evaluation: evaluation,
            nextQuestion: isComplete ? null : nextQ, // Return null if interview is complete
            isComplete: isComplete, // Flag to indicate interview is done
            maxQuestions: maxQuestions,
            currentQuestionNumber: turnNumber,
            adaptation: {
                decision: adaptationDecision.decision,
                reasoning: adaptationDecision.reasoning,
                next_difficulty: adaptationDecision.next_difficulty
            },
            analytics: {
                overall: analytics.dimensionScores.overall,
                trend: analytics.progression.trajectory,
                consistency: analytics.consistency.score
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * End interview and generate final report
     */
    async endInterview(interviewId) {
        const interview = await Interview.findById(interviewId);
        if (!interview) throw new Error("Interview not found");

        // 1. Get full history
        const history = await memoryService.getHistory(interviewId);
        if (!history || history.length === 0) {
            throw new Error("No interview history found");
        }

        // 2. Compute final analytics
        const analytics = analyticsBlock.computeAnalytics(history, {
            role: interview.role,
            experienceLevel: interview.experienceLevel,
            skills: interview.settings.skills
        });

        // 3. Generate coaching plan
        const coaching = await coachingBlock.generateCoachingPlan(
            analytics,
            history,
            {
                role: interview.role,
                experienceLevel: interview.experienceLevel,
                skills: interview.settings.skills
            }
        );

        // 4. Generate final report
        const reportData = await reportService.generateReport(
            history,
            analytics,
            coaching,
            {
                role: interview.role,
                targetPosition: interview.targetPosition,
                experienceLevel: interview.experienceLevel,
                skills: interview.settings.skills
            }
        );

        // 5. Save report to database
        await reportService.saveReport(interviewId, reportData);

        // 5. Update interview status
        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.overallScore = reportData.executive_summary?.overall_readiness || analytics.dimensionScores.overall * 10;
        await interview.save();

        return reportData;
    }

    /**
     * Update cognitive state after each evaluation
     */
    _updateCognitiveState(interview, evaluation, turnNumber) {
        const { cognitiveState } = interview;

        // Update confidence and clarity trends
        if (evaluation.confidence_score !== undefined) {
            cognitiveState.confidenceTrend.push(evaluation.confidence_score);
        }
        if (evaluation.clarity_score !== undefined) {
            cognitiveState.clarityTrend.push(evaluation.clarity_score);
        }

        // Update performance trend
        const recentScores = cognitiveState.confidenceTrend.slice(-5);
        if (recentScores.length >= 3) {
            const firstHalf = recentScores.slice(0, Math.ceil(recentScores.length / 2));
            const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            if (secondAvg > firstAvg + 0.5) cognitiveState.performanceTrend = 'improving';
            else if (secondAvg < firstAvg - 0.5) cognitiveState.performanceTrend = 'declining';
            else if (Math.abs(secondAvg - firstAvg) < 0.3) cognitiveState.performanceTrend = 'stable';
            else cognitiveState.performanceTrend = 'volatile';
        }

        // Update detected strengths and weaknesses
        if (evaluation.strengths && evaluation.strengths.length > 0) {
            evaluation.strengths.forEach(strength => {
                const existing = cognitiveState.detectedStrengths.find(s => s.concept === strength);
                if (existing) {
                    existing.evidence.push(`Turn ${turnNumber}`);
                    existing.confidence = Math.min(10, existing.confidence + 0.5);
                } else {
                    cognitiveState.detectedStrengths.push({
                        concept: strength,
                        evidence: [`Turn ${turnNumber}`],
                        confidence: 5
                    });
                }
            });
        }

        if (evaluation.mistakes && evaluation.mistakes.length > 0) {
            evaluation.mistakes.forEach(mistake => {
                const existing = cognitiveState.detectedWeaknesses.find(w => w.concept === mistake);
                if (existing) {
                    existing.evidence.push(`Turn ${turnNumber}`);
                    existing.severity = Math.min(10, existing.severity + 0.5);
                } else {
                    cognitiveState.detectedWeaknesses.push({
                        concept: mistake,
                        evidence: [`Turn ${turnNumber}`],
                        severity: 5
                    });
                }
            });
        }

        // Update concept mastery (if question had expected concepts)
        // This would be updated from the question's expected_concepts

        interview.cognitiveState = cognitiveState;
    }

    /**
     * Map difficulty string to experience level
     */
    _mapDifficultyToLevel(difficulty) {
        const mapping = {
            'junior': 'Junior',
            'entry': 'Junior',
            'intern': 'Junior',
            'mid': 'Mid-Level',
            'mid-level': 'Mid-Level',
            'intermediate': 'Mid-Level',
            'senior': 'Senior',
            'staff': 'Staff+',
            'staff+': 'Staff+',
            'principal': 'Staff+',
            'architect': 'Staff+'
        };
        return mapping[difficulty?.toLowerCase()] || 'Mid-Level';
    }

    /**
     * Calculate maximum number of questions based on duration
     * 10 min = 5 questions, 20 min = 7 questions, 30 min = 9 questions, 45 min = 12 questions
     */
    _calculateMaxQuestions(duration) {
        const durationMap = {
            10: 5,
            20: 7,
            30: 9,
            45: 12
        };
        
        // Find closest duration or use linear interpolation
        if (durationMap[duration]) {
            return durationMap[duration];
        }
        
        // Linear interpolation for other durations
        const durations = Object.keys(durationMap).map(Number).sort((a, b) => a - b);
        if (duration < durations[0]) {
            return durationMap[durations[0]];
        }
        if (duration > durations[durations.length - 1]) {
            return durationMap[durations[durations.length - 1]];
        }
        
        // Find the two closest durations and interpolate
        for (let i = 0; i < durations.length - 1; i++) {
            if (duration >= durations[i] && duration <= durations[i + 1]) {
                const d1 = durations[i];
                const d2 = durations[i + 1];
                const q1 = durationMap[d1];
                const q2 = durationMap[d2];
                const ratio = (duration - d1) / (d2 - d1);
                return Math.round(q1 + (q2 - q1) * ratio);
            }
        }
        
        return 7; // Default fallback
    }
}

module.exports = new InterviewService();
