const Report = require('../models/Report');
const reportBlock = require('./blocks/report.block');
const analyticsBlock = require('./blocks/analytics.block');
const coachingBlock = require('./blocks/coaching.block');
const memoryService = require('./memory');
const Interview = require('../models/Interview');

/**
 * Report Service - Final Report Generation
 * 
 * Orchestrates the generation of the comprehensive hiring-style report
 * by combining analytics, coaching, and AI-generated insights.
 */
class ReportService {
    /**
     * Generate comprehensive report (called from interview service)
     * This is a helper that can be called directly if needed
     */
    async generateReport(history, analytics, coaching, roleContext) {
        try {
            // Map history to expected format
            const sessionHistory = history.map(item => ({
                question: item.question,
                answer: item.answer,
                evaluation: item.evaluation,
                turnNumber: item.turnNumber
            }));

            // Generate comprehensive report
            const reportData = await reportBlock.generateReport(
                sessionHistory,
                analytics,
                coaching,
                roleContext
            );

            return reportData;
        } catch (error) {
            console.error("ReportService Error:", error);
            throw error;
        }
    }

    /**
     * Save report to database
     */
    async saveReport(interviewId, reportData) {
        try {
            const report = new Report({
                interviewId,
                overallScore: reportData.executive_summary?.overall_readiness || 0,
                technicalDepth: reportData.performance_breakdown?.technical_depth?.score || 0,
                communication: reportData.performance_breakdown?.communication?.score || 0,
                problemSolving: reportData.performance_breakdown?.problem_solving?.score || 0,
                strengths: reportData.skill_assessment?.strongest_skills?.map(s => s.skill) || [],
                weaknesses: reportData.skill_assessment?.weakest_skills?.map(s => s.skill) || [],
                improvementPlan: reportData.improvement_roadmap?.priority_actions?.map(a => a.action) || [],
                verdict: reportData.hire_recommendation?.verdict || 'Pending',
                technicalSummary: reportData.performance_breakdown?.technical_depth?.assessment || '',
                behavioralSummary: reportData.communication_assessment?.overall || '',
                jsonReport: reportData
            });

            await report.save();
            return report;
        } catch (error) {
            console.error("Error saving report:", error);
            throw error;
        }
    }

    /**
     * Get report for an interview
     */
    async getReport(interviewId) {
        return await Report.findOne({ interviewId });
    }

    /**
     * Generate report from interview ID (standalone method)
     */
    async generateReportFromInterview(interviewId) {
        try {
            const interview = await Interview.findById(interviewId);
            if (!interview) {
                throw new Error("Interview not found");
            }

            // Get history
            const history = await memoryService.getHistory(interviewId);
            if (!history || history.length === 0) {
                throw new Error("No interview history found");
            }

            // Compute analytics
            const analytics = analyticsBlock.computeAnalytics(history, {
                role: interview.role,
                experienceLevel: interview.experienceLevel,
                skills: interview.settings.skills
            });

            // Generate coaching
            const coaching = await coachingBlock.generateCoachingPlan(
                analytics,
                history,
                {
                    role: interview.role,
                    experienceLevel: interview.experienceLevel,
                    skills: interview.settings.skills
                }
            );

            // Generate report
            const reportData = await this.generateReport(
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

            // Save to DB
            await this.saveReport(interviewId, reportData);

            return reportData;
        } catch (error) {
            console.error("Error generating report from interview:", error);
            throw error;
        }
    }
}

module.exports = new ReportService();
