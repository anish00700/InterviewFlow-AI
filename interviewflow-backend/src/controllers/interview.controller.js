const interviewService = require('../services/interview');

exports.startInterview = async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.skills || !Array.isArray(req.body.skills) || req.body.skills.length === 0) {
            return res.status(400).json({ message: 'At least one skill must be selected' });
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
