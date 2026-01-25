const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true, unique: true },
    overallScore: { type: Number },
    technicalDepth: { type: Number },
    communication: { type: Number },
    problemSolving: { type: Number },

    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementPlan: [{ type: String }],

    verdict: {
        type: String,
        enum: ['Strong Hire', 'Hire', 'Borderline', 'No Hire', 'Pending'],
        default: 'Pending'
    },

    technicalSummary: String,
    behavioralSummary: String,

    // Store full raw JSON helper
    jsonReport: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
