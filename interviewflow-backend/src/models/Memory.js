const mongoose = require('mongoose');

/**
 * Memory Schema - Structured Cognitive State Storage
 * 
 * Each turn stores:
 * - Question with intent and expected concepts
 * - Answer
 * - Multi-dimensional evaluation
 * - Adaptation decision that led to this question
 */
const memorySchema = new mongoose.Schema({
    interviewId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Interview', 
        required: true 
    },
    turnNumber: { 
        type: Number, 
        required: true 
    },
    question: {
        id: String,
        text: String,
        skill: String,
        difficulty: String,
        intent: String,
        expected_concepts: [String], // Concepts this question tests
        reasoning: String // Why this question was chosen
    },
    answer: { 
        type: String, 
        required: true 
    },
    evaluation: {
        relevance_score: Number,
        correctness_score: Number,
        depth_score: Number,
        clarity_score: Number,
        confidence_score: Number,
        overall_score: Number,
        feedback: String,
        interviewer_commentary: String,
        improvement_feedback: [String],
        mistakes: [String],
        missing_points: [String],
        strengths: [String],
        suggested_followup_question: String,
        answer_type: String,
        is_answer_relevant: Boolean,
        is_factually_correct: Boolean,
        hallucination_detected: Boolean,
        next_question_difficulty: String
    },
    // Store adaptation decision that led to this question
    adaptation: {
        decision: String,
        reasoning: String,
        question_type: String
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true,
    strict: false // Allow dynamic fields
});

// Index for efficient retrieval of session history
memorySchema.index({ interviewId: 1, turnNumber: 1 });
memorySchema.index({ interviewId: 1, timestamp: -1 });

module.exports = mongoose.model('Memory', memorySchema);
