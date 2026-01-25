const mongoose = require('mongoose');

/**
 * Interview State Schema - Central Brain of the AI Interview Engine
 * 
 * This is the living state that drives all adaptive decisions.
 * It maintains cognitive context, performance trends, and mastery maps.
 */
const interviewSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false 
    },
    
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    },

    // ========== ROLE & TARGET CONFIGURATION ==========
    role: {
        type: String,
        required: true,
        default: 'Software Engineer'
    },
    targetPosition: {
        type: String, // e.g., "Frontend Intern", "Backend Engineer", "System Designer"
        default: 'Software Engineer'
    },
    experienceLevel: {
        type: String,
        enum: ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Staff+'],
        default: 'Mid-Level'
    },

    // ========== SKILL FOCUS & SETTINGS ==========
    settings: {
        skills: [{ type: String }],
        difficulty: { type: String, default: 'Mid-Level' },
        duration: { type: Number, default: 30 },
        role: { type: String, default: 'Software Engineer' }
    },

    // ========== COGNITIVE STATE (Central Brain) ==========
    cognitiveState: {
        // Current difficulty calibration
        currentDifficulty: {
            type: String,
            enum: ['easier', 'same', 'harder'],
            default: 'same'
        },
        
        // Performance tracking
        performanceTrend: {
            type: String,
            enum: ['improving', 'stable', 'declining', 'volatile'],
            default: 'stable'
        },
        
        // Concept mastery map: { concept: masteryLevel (0-10) }
        conceptMastery: {
            type: Map,
            of: Number,
            default: new Map()
        },
        
        // Confidence and clarity trends (arrays of scores over time)
        confidenceTrend: [{ type: Number }],
        clarityTrend: [{ type: Number }],
        
        // Detected patterns
        detectedStrengths: [{ 
            concept: String,
            evidence: [String], // Turn numbers or question IDs where strength was shown
            confidence: Number // 0-10
        }],
        detectedWeaknesses: [{ 
            concept: String,
            evidence: [String],
            severity: Number // 0-10, higher = more critical
        }],
        
        // Communication analysis
        communicationProfile: {
            clarity: { type: Number, default: 0 }, // Average clarity score
            structure: { type: Number, default: 0 }, // How well-structured answers are
            completeness: { type: Number, default: 0 }, // How complete answers are
            consistency: { type: Number, default: 0 } // Consistency across turns
        },
        
        // Reasoning quality
        reasoningQuality: {
            average: { type: Number, default: 0 },
            trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' }
        },
        
        // Learning curve analysis
        learningCurve: {
            slope: { type: Number, default: 0 }, // Positive = improving, negative = declining
            variance: { type: Number, default: 0 }, // How much scores vary
            cognitiveLoad: { type: Number, default: 0 } // How well candidate handles complexity
        }
    },

    // ========== INTERVIEW PROGRESSION ==========
    context: {
        weakAreas: [{ type: String }],
        strongAreas: [{ type: String }],
        previousQuestions: [{ type: String }],
        // Enhanced: Track question intents and concepts tested
        testedConcepts: [{ 
            concept: String,
            turns: [Number], // Which turns tested this concept
            averageScore: Number
        }]
    },
    
    currentQuestionIndex: { type: Number, default: 0 },
    totalTurns: { type: Number, default: 0 },
    
    // Current question being asked
    currentQuestion: {
        question_id: String,
        question_text: String,
        text: String,
        skill_focus: String,
        difficulty: String,
        intent: String,
        expected_concepts: [String],
        reasoning: String // Why this question was chosen
    },

    // ========== SCORING & ANALYTICS ==========
    overallScore: { type: Number },
    
    // Per-dimension aggregates
    dimensionScores: {
        relevance: { type: Number, default: 0 },
        correctness: { type: Number, default: 0 },
        depth: { type: Number, default: 0 },
        clarity: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
        reasoning: { type: Number, default: 0 }
    },
    
    // Per-skill aggregates
    skillScores: {
        type: Map,
        of: {
            averageScore: Number,
            turnCount: Number,
            trend: String
        },
        default: new Map()
    },
    
    // Consistency metrics
    consistencyScore: { type: Number, default: 0 },
    
    // ========== ADAPTATION HISTORY ==========
    adaptationHistory: [{
        turn: Number,
        decision: String, // e.g., "increase_difficulty", "switch_topic", "deepen_probe"
        reason: String,
        previousScore: Number,
        newDifficulty: String
    }],

    // ========== TIMESTAMPS ==========
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastActivityAt: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    // Allow dynamic fields for flexibility
    strict: false 
});

// Indexes for performance
interviewSchema.index({ userId: 1, status: 1 });
interviewSchema.index({ status: 1, startedAt: -1 });

module.exports = mongoose.model('Interview', interviewSchema);
