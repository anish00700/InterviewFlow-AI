const interviewService = require('../services/interview');
const Interview = require('../models/Interview');
const Report = require('../models/Report');

exports.startInterview = async (req, res) => {
    try {
        const { skills, resumeTopics, mode } = req.body;

        const hasSkills =
            Array.isArray(skills) && skills.length > 0;
        const hasResumeTopics =
            Array.isArray(resumeTopics) && resumeTopics.length > 0;

        // Validate: at least one source of topics must be provided
        if (!hasSkills && !hasResumeTopics) {
            return res.status(400).json({
                message: 'Please select at least one skill or at least one topic from your resume',
            });
        }

        // Optional: basic mode validation (but we keep it lenient)
        const allowedModes = ['skills', 'resume_only', 'mixed', undefined, null];
        if (!allowedModes.includes(mode)) {
            return res.status(400).json({
                message: 'Invalid interview mode. Use "skills", "resume_only", or "mixed".',
            });
        }

        const session = await interviewService.startInterview(req.body);
        res.status(201).json(session);
    } catch (error) {
        console.error('Error starting interview:', error);
        const message = error.message || 'Failed to start interview. Please try again.';
        res.status(500).json({ message });
    }
};

exports.submitAnswer = async (req, res) => {
    try {
        // Need to pass session ID. Assuming it's in body or param.
        // The current FE might be passing 'sessionId' in body? 
        // Let's assume req.body has { interviewId, answer, questionId }
        const { answer, questionId, interviewId } = req.body;
        
        // Validate required fields
        if (!answer || !answer.trim()) {
            return res.status(400).json({ message: 'Answer cannot be empty' });
        }
        
        if (!questionId) {
            return res.status(400).json({ message: 'Question ID is required' });
        }
        
        // Fallback: if interviewId is missing but 'sessionId' is present (legacy)
        const id = interviewId || req.body.sessionId;
        
        if (!id) {
            return res.status(400).json({ message: 'Interview session ID is required' });
        }

        const result = await interviewService.processAnswer(id, answer, questionId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error submitting answer:', error);
        const message = error.message || 'Failed to submit answer. Please try again.';
        const statusCode = error.message?.includes('not found') || error.message?.includes('inactive') ? 404 : 500;
        res.status(statusCode).json({ message });
    }
};

// @desc    Get interview history for the logged-in user
// @route   GET /api/interview/history
// @access  Private
exports.getInterviewHistory = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Fetch recent interviews for this user
        const interviews = await Interview.find({ userId })
            .sort({ startedAt: -1 })
            .limit(50)
            .lean();

        if (!interviews || interviews.length === 0) {
            return res.status(200).json({ items: [] });
        }

        const interviewIds = interviews.map((i) => i._id);

        // Fetch associated reports to enrich history
        const reports = await Report.find({ interviewId: { $in: interviewIds } })
            .select('interviewId overallScore verdict strengths weaknesses createdAt')
            .lean();

        const reportByInterview = {};
        reports.forEach((r) => {
            reportByInterview[r.interviewId.toString()] = r;
        });

        const items = interviews.map((i) => {
            const rep = reportByInterview[i._id.toString()];
            return {
                id: i._id,
                status: i.status,
                startedAt: i.startedAt,
                completedAt: i.completedAt,
                role: i.role,
                experienceLevel: i.experienceLevel,
                skills: i.settings?.skills || [],
                overallScore: rep?.overallScore ?? i.overallScore ?? null,
                verdict: rep?.verdict ?? 'Pending',
                topStrengths: rep?.strengths?.slice(0, 3) || [],
                topWeaknesses: rep?.weaknesses?.slice(0, 3) || [],
            };
        });

        res.status(200).json({ items });
    } catch (error) {
        console.error('Error fetching interview history:', error);
        const message = error.message || 'Failed to fetch interview history. Please try again.';
        res.status(500).json({ message });
    }
};

// @desc    Mark interview as completed and generate/save final report
// @route   POST /api/interview/:id/complete
// @access  Private
exports.completeInterview = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const interviewId = req.params.id;
        if (!interviewId) {
            return res.status(400).json({ message: 'Interview ID is required' });
        }

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        // Ensure the interview belongs to the current user
        if (interview.userId && interview.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You do not have access to this interview' });
        }

        const reportData = await interviewService.endInterview(interviewId);

        res.status(200).json({
            message: 'Interview completed and report generated',
            overallScore: interview.overallScore,
            report: reportData
        });
    } catch (error) {
        console.error('Error completing interview:', error);
        const message = error.message || 'Failed to complete interview and generate report.';
        res.status(500).json({ message });
    }
};

