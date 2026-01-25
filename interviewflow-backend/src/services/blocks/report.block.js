const { generateContentWithFallback } = require('../../config/github-models-helper');

/**
 * Report Block - Hiring-Style Evaluation Report Generator
 * 
 * Produces a comprehensive, hiring-committee-style report with:
 * - Overall readiness assessment
 * - Skill-wise performance breakdown
 * - Strength and weakness clusters
 * - Communication assessment
 * - Problem-solving maturity
 * - Learning potential
 * - Risk factors
 * - Hire/Borderline/No-Hire verdict with justification
 * - Personalized improvement roadmap
 */
class ReportBlock {
    /**
     * Generate comprehensive hiring-style report
     * 
     * @param {Array} sessionHistory - Full interview history
     * @param {Object} analytics - Comprehensive analytics from analytics block
     * @param {Object} coaching - Coaching plan from coaching block
     * @param {Object} roleContext - Role, level, skills
     * @returns {Object} Complete hiring report
     */
    async generateReport(sessionHistory, analytics, coaching, roleContext) {
        // Build comprehensive context for report generation
        const reportContext = this._buildReportContext(
            sessionHistory,
            analytics,
            coaching,
            roleContext
        );

        const prompt = `
        You are a hiring committee at a top tech company.
        Your task is to write a comprehensive, hiring-committee-style evaluation report.

        This is NOT a simple summary. This is a DECISION DOCUMENT that will be used to make hiring decisions.

        Interview Context:
        Role: ${roleContext.role}
        Target Position: ${roleContext.targetPosition || roleContext.role}
        Experience Level: ${roleContext.experienceLevel}
        Skills Tested: ${roleContext.skills.join(', ')}

        ${reportContext}

        Your Task:
        Write a comprehensive hiring evaluation report as if you were presenting to a hiring committee.

        The report must include:

        1. EXECUTIVE SUMMARY
           - Overall readiness score (0-100)
           - Hire recommendation (Strong Hire / Hire / Borderline / No Hire)
           - One-paragraph summary

        2. PERFORMANCE BREAKDOWN
           - Technical depth assessment
           - Problem-solving maturity
           - Communication effectiveness
           - Reasoning quality
           - Consistency and reliability

        3. SKILL ASSESSMENT
           - Per-skill performance with evidence
           - Strongest areas with examples
           - Weakest areas with examples
           - Skill gaps and their impact

        4. STRENGTHS & WEAKNESSES
           - Clustered strengths (not just a list)
           - Clustered weaknesses (not just a list)
           - How strengths align with role requirements
           - How weaknesses impact role performance

        5. COMMUNICATION ASSESSMENT
           - Clarity and structure
           - Completeness
           - Consistency
           - Areas for improvement

        6. PROBLEM-SOLVING MATURITY
           - Approach to problems
           - Depth of thinking
           - Trade-off analysis capability
           - Edge case handling

        7. LEARNING POTENTIAL
           - Learning curve analysis
           - Improvement trajectory
           - Adaptability
           - Growth mindset indicators

        8. RISK FACTORS
           - Critical gaps
           - Consistency concerns
           - Red flags (if any)
           - Mitigation strategies

        9. HIRE RECOMMENDATION
           - Verdict: Strong Hire / Hire / Borderline / No Hire
           - Detailed justification
           - Confidence level
           - Comparison to role expectations

        10. IMPROVEMENT ROADMAP
            - Prioritized action items
            - Timeline expectations
            - Success metrics

        Return JSON only:
        {
          "executive_summary": {
            "overall_readiness": 0-100,
            "hire_recommendation": "Strong Hire | Hire | Borderline | No Hire",
            "summary": "One paragraph summary",
            "confidence": "high | medium | low"
          },
          "performance_breakdown": {
            "technical_depth": {
              "score": 0-100,
              "assessment": "Detailed assessment",
              "evidence": ["Evidence 1", "Evidence 2"]
            },
            "problem_solving": {
              "score": 0-100,
              "assessment": "Detailed assessment",
              "evidence": ["Evidence 1", "Evidence 2"]
            },
            "communication": {
              "score": 0-100,
              "assessment": "Detailed assessment",
              "evidence": ["Evidence 1", "Evidence 2"]
            },
            "reasoning_quality": {
              "score": 0-100,
              "assessment": "Detailed assessment",
              "evidence": ["Evidence 1", "Evidence 2"]
            },
            "consistency": {
              "score": 0-100,
              "assessment": "Detailed assessment"
            }
          },
          "skill_assessment": {
            "strongest_skills": [
              {
                "skill": "Skill name",
                "score": 0-100,
                "evidence": ["Evidence 1", "Evidence 2"],
                "alignment_with_role": "How this aligns"
              }
            ],
            "weakest_skills": [
              {
                "skill": "Skill name",
                "score": 0-100,
                "evidence": ["Evidence 1", "Evidence 2"],
                "impact": "Impact on role performance"
              }
            ]
          },
          "strengths_clusters": [
            {
              "cluster": "Cluster name",
              "strengths": ["Strength 1", "Strength 2"],
              "evidence": ["Evidence"],
              "role_alignment": "How this helps in the role"
            }
          ],
          "weakness_clusters": [
            {
              "cluster": "Cluster name",
              "weaknesses": ["Weakness 1", "Weakness 2"],
              "evidence": ["Evidence"],
              "impact": "Impact on role"
            }
          ],
          "communication_assessment": {
            "overall": 0-100,
            "clarity": "Assessment",
            "structure": "Assessment",
            "completeness": "Assessment",
            "consistency": "Assessment",
            "improvement_areas": ["Area 1", "Area 2"]
          },
          "problem_solving_maturity": {
            "score": 0-100,
            "approach": "Assessment",
            "depth": "Assessment",
            "trade_offs": "Assessment",
            "edge_cases": "Assessment"
          },
          "learning_potential": {
            "score": 0-100,
            "trajectory": "Assessment",
            "adaptability": "Assessment",
            "growth_mindset": "Assessment",
            "indicators": ["Indicator 1", "Indicator 2"]
          },
          "risk_factors": [
            {
              "risk": "Risk description",
              "severity": "high | medium | low",
              "mitigation": "How to mitigate"
            }
          ],
          "hire_recommendation": {
            "verdict": "Strong Hire | Hire | Borderline | No Hire",
            "justification": "Detailed justification paragraph",
            "confidence": "high | medium | low",
            "comparison_to_expectations": "How candidate compares to role expectations"
          },
          "improvement_roadmap": {
            "priority_actions": [
              {
                "action": "Action item",
                "priority": 1-10,
                "timeline": "Expected timeline",
                "success_metrics": "How to measure success"
              }
            ],
            "study_plan": "High-level study plan",
            "expected_timeline": "Overall improvement timeline"
          }
        }
        `;

        try {
            const result = await generateContentWithFallback(prompt, {
                max_tokens: 2000  // Reports need more tokens, but still reduced
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
            const report = JSON.parse(jsonStr);

            // Merge with analytics and coaching for complete report
            return {
                ...report,
                analytics: analytics,
                coaching: coaching,
                metadata: {
                    totalTurns: sessionHistory.length,
                    role: roleContext.role,
                    experienceLevel: roleContext.experienceLevel,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error("Report Generation Error:", error);
            return this._fallbackReport(analytics, coaching, roleContext);
        }
    }

    /**
     * Build comprehensive report context
     */
    _buildReportContext(sessionHistory, analytics, coaching, roleContext) {
        let context = `
        PERFORMANCE ANALYTICS:
        
        Dimension Scores (0-10):
        - Overall: ${analytics.dimensionScores.overall.toFixed(1)}
        - Relevance: ${analytics.dimensionScores.relevance.toFixed(1)}
        - Correctness: ${analytics.dimensionScores.correctness.toFixed(1)}
        - Depth: ${analytics.dimensionScores.depth.toFixed(1)}
        - Clarity: ${analytics.dimensionScores.clarity.toFixed(1)}
        - Confidence: ${analytics.dimensionScores.confidence.toFixed(1)}
        - Reasoning: ${analytics.dimensionScores.reasoning.toFixed(1)}

        Performance Trends:
        - Trajectory: ${analytics.progression.trajectory}
        - Improvement Rate: ${analytics.progression.improvementRate.toFixed(2)}
        - Consistency: ${analytics.consistency.score.toFixed(1)}/10
        - Learning Curve: ${analytics.learningCurve.trend}

        Communication Profile:
        - Effectiveness: ${analytics.communication.effectiveness.toFixed(1)}/10
        - Clarity: ${analytics.communication.clarity.toFixed(1)}/10
        - Structure: ${analytics.communication.structure.toFixed(1)}/10
        - Completeness: ${analytics.communication.completeness.toFixed(1)}/10

        Skill Performance:
        `;

        Object.entries(analytics.skillScores).forEach(([skill, data]) => {
            context += `- ${skill}: ${data.averageScore.toFixed(1)}/10 (${data.turnCount} questions, trend: ${data.trend})\n`;
        });

        context += `\n\nCOACHING INSIGHTS:\n`;
        if (coaching.critical_gaps && coaching.critical_gaps.length > 0) {
            context += `Critical Gaps:\n`;
            coaching.critical_gaps.forEach(gap => {
                context += `- ${gap.concept} (${gap.severity}): ${gap.why_it_matters}\n`;
            });
        }

        if (coaching.improvement_roadmap && coaching.improvement_roadmap.length > 0) {
            context += `\nImprovement Roadmap:\n`;
            coaching.improvement_roadmap.slice(0, 5).forEach(item => {
                context += `- Priority ${item.priority}: ${item.focus_area}\n`;
            });
        }

        context += `\n\nINTERVIEW HISTORY SUMMARY:\n`;
        sessionHistory.slice(0, 10).forEach((item, index) => {
            context += `Q${index + 1}: ${item.question?.text || item.question?.question_text || 'N/A'}\n`;
            context += `Score: ${item.evaluation?.overall_score || 0}/10\n`;
            context += `Type: ${item.evaluation?.answer_type || 'N/A'}\n---\n`;
        });

        return context;
    }

    /**
     * Fallback report when AI fails
     */
    _fallbackReport(analytics, coaching, roleContext) {
        const overallScore = analytics.dimensionScores.overall * 10; // Convert to 0-100

        let verdict = 'Borderline';
        if (overallScore >= 80) verdict = 'Strong Hire';
        else if (overallScore >= 70) verdict = 'Hire';
        else if (overallScore >= 60) verdict = 'Borderline';
        else verdict = 'No Hire';

        return {
            executive_summary: {
                overall_readiness: overallScore,
                hire_recommendation: verdict,
                summary: `Candidate scored ${overallScore.toFixed(0)}/100 overall. Performance analysis indicates ${verdict.toLowerCase()} recommendation.`,
                confidence: 'medium'
            },
            performance_breakdown: {
                technical_depth: {
                    score: analytics.dimensionScores.depth * 10,
                    assessment: 'Technical depth analysis',
                    evidence: []
                },
                problem_solving: {
                    score: analytics.dimensionScores.reasoning * 10,
                    assessment: 'Problem-solving assessment',
                    evidence: []
                },
                communication: {
                    score: analytics.communication.effectiveness * 10,
                    assessment: 'Communication assessment',
                    evidence: []
                },
                reasoning_quality: {
                    score: analytics.dimensionScores.reasoning * 10,
                    assessment: 'Reasoning quality assessment',
                    evidence: []
                },
                consistency: {
                    score: analytics.consistency.score * 10,
                    assessment: 'Consistency assessment'
                }
            },
            skill_assessment: {
                strongest_skills: [],
                weakest_skills: []
            },
            strengths_clusters: [],
            weakness_clusters: [],
            communication_assessment: {
                overall: analytics.communication.effectiveness * 10,
                clarity: 'Clarity assessment',
                structure: 'Structure assessment',
                completeness: 'Completeness assessment',
                consistency: 'Consistency assessment',
                improvement_areas: []
            },
            problem_solving_maturity: {
                score: analytics.dimensionScores.reasoning * 10,
                approach: 'Approach assessment',
                depth: 'Depth assessment',
                trade_offs: 'Trade-off assessment',
                edge_cases: 'Edge case assessment'
            },
            learning_potential: {
                score: 50,
                trajectory: analytics.progression.trajectory,
                adaptability: 'Adaptability assessment',
                growth_mindset: 'Growth mindset assessment',
                indicators: []
            },
            risk_factors: [],
            hire_recommendation: {
                verdict: verdict,
                justification: `Based on overall score of ${overallScore.toFixed(0)}/100`,
                confidence: 'medium',
                comparison_to_expectations: 'Comparison to role expectations'
            },
            improvement_roadmap: {
                priority_actions: [],
                study_plan: 'Study plan',
                expected_timeline: 'Timeline'
            },
            analytics: analytics,
            coaching: coaching,
            metadata: {
                totalTurns: 0,
                role: roleContext.role,
                experienceLevel: roleContext.experienceLevel,
                generatedAt: new Date().toISOString()
            }
        };
    }
}

module.exports = new ReportBlock();
