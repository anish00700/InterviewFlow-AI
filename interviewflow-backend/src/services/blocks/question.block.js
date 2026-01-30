const { generateContentWithFallback } = require('../../config/github-models-helper');

class QuestionBlock {
    async generateLoadingQuestion(context) {
        // Fallback or initial question if needed, but primarily used for adaptive generation
        return {
            id: 'loading',
            text: 'Analyzing your profile and generating the best interview question...',
            difficulty: 'adapter'
        };
    }

    /**
     * Generate next question with cognitive probing logic
     * 
     * @param {Object} context - Interview context
     * @param {Object} adaptationDecision - Decision from adaptation block
     * @param {Object} cognitiveState - Current cognitive state
     */
    /**
     * Map experience level to base difficulty
     */
    _mapLevelToBaseDifficulty(level) {
        const levelLower = (level || '').toLowerCase();
        if (levelLower.includes('junior') || levelLower.includes('entry') || levelLower.includes('intern')) {
            return 'easy';
        } else if (levelLower.includes('mid') || levelLower.includes('intermediate')) {
            return 'medium';
        } else if (levelLower.includes('senior')) {
            return 'hard';
        } else if (levelLower.includes('staff') || levelLower.includes('principal') || levelLower.includes('architect')) {
            return 'staff';
        }
        return 'medium'; // Default
    }

    /**
     * Get question style variety based on turn number
     */
    _getQuestionStyleVariety(turnNumber) {
        const styles = [
            'conceptual explanation',
            'practical scenario',
            'trade-off analysis',
            'problem-solving',
            'architecture design',
            'debugging scenario',
            'optimization challenge',
            'system design',
            'code review',
            'best practices'
        ];
        return styles[turnNumber % styles.length] || styles[0];
    }

    async generateNextQuestion(context, adaptationDecision = null, cognitiveState = null) {
        const { role, skill, level, previousQuestions, weakAreas, strongAreas, allSkills, turnNumber } = context;
        
        // Map experience level to base difficulty
        const baseDifficulty = this._mapLevelToBaseDifficulty(level);
        const questionStyle = this._getQuestionStyleVariety(turnNumber || 0);

        // Build comprehensive context for intelligent question generation
        let adaptationContext = '';
        if (adaptationDecision) {
            adaptationContext = `
        ADAPTATION STRATEGY (from AI reasoning):
        Decision: ${adaptationDecision.decision}
        Reasoning: ${adaptationDecision.reasoning}
        Next Difficulty: ${adaptationDecision.next_difficulty}
        Focus Area: ${adaptationDecision.focus_area}
        Question Type: ${adaptationDecision.question_type}
        Probe Direction: ${adaptationDecision.probe_direction}
        Should Go Deeper: ${adaptationDecision.should_go_deeper}
        Should Switch Topic: ${adaptationDecision.should_switch_topic}
            `;
        }

        let cognitiveContext = '';
        if (cognitiveState) {
            const { performanceTrend, detectedStrengths, detectedWeaknesses, conceptMastery } = cognitiveState;
            cognitiveContext = `
        COGNITIVE STATE:
        Performance Trend: ${performanceTrend}
        Detected Strengths: ${detectedStrengths?.map(s => s.concept).join(', ') || 'None yet'}
        Detected Weaknesses: ${detectedWeaknesses?.map(w => w.concept).join(', ') || 'None yet'}
        Concept Mastery Map: ${JSON.stringify(conceptMastery && typeof conceptMastery.entries === 'function' ? Object.fromEntries(conceptMastery) : (conceptMastery || {}))}
            `;
        }

        // Build unique question context to prevent repetition
        // Extract full question text from previous questions (handle both string and object formats)
        const previousQuestionsText = previousQuestions && previousQuestions.length > 0
            ? previousQuestions.map((q, idx) => {
                const qText = typeof q === 'string' ? q : (q.text || q.question_text || q);
                return `Q${idx + 1}: "${qText}"`;
              }).join('\n')
            : 'No previous questions yet.';
        
        // Also create a summary of question styles used
        const usedQuestionStyles = previousQuestions.length > 0 
            ? `Previous questions used ${previousQuestions.length} different question(s).`
            : 'This is the first question.';

        // Get all tested concepts to avoid repetition (support both Map and plain object from DB)
        const cm = cognitiveState?.conceptMastery;
        const testedConceptsList = cm
            ? (typeof cm.keys === 'function' ? Array.from(cm.keys()) : Object.keys(cm)).join(', ')
            : 'None yet';

        const prompt = `
        You are a Staff Engineer and Interview Panelist at a top tech company.
        You design interview questions that are:
        Role-appropriate, Skill-focused, Difficulty-calibrated, Progressively adaptive, NON-REPETITIVE, Real-world and signal-rich.

        ========================================
        CRITICAL: QUESTION UNIQUENESS REQUIREMENTS
        ========================================
        You MUST generate a COMPLETELY UNIQUE question that:
        1. Has NOT been asked before (check previous questions carefully - word by word)
        2. Tests DIFFERENT concepts or aspects than previous questions
        3. Is NOT a variation, rephrasing, or reformulation of previous questions
        4. Uses a DIFFERENT question style/format than previous questions
        5. Focuses on DIFFERENT subtopics or angles within the skill area
        6. Brings NEW value to the interview assessment
        7. Avoids similar phrasing, structure, or approach to previous questions

        ANTI-REPETITION STRATEGY:
        - If previous questions were conceptual, make this one practical/scenario-based
        - If previous questions were practical, make this one theoretical/architectural
        - If previous questions asked "what", ask "how" or "why" or "what if"
        - If previous questions were about basics, ask about edge cases or trade-offs
        - Rotate between different question formats: explanation, scenario, design, debugging, optimization
        - Use different entry points: "Explain", "How would you", "What would happen if", "Design", "Debug", "Optimize"

        ========================================
        DIFFICULTY CALIBRATION BY EXPERIENCE LEVEL
        ========================================
        Experience Level: ${level || 'Mid-Level'}
        Base Difficulty: ${baseDifficulty}
        
        DIFFICULTY GUIDELINES:
        - Junior/Entry Level (${baseDifficulty === 'easy' ? '← YOU ARE HERE' : ''}):
          * Ask foundational, conceptual questions
          * Focus on "what" and basic "how"
          * Test understanding of core concepts
          * Use simple, clear scenarios
          * Avoid complex trade-offs or edge cases
          * Difficulty should be: "easy"
        
        - Mid-Level (${baseDifficulty === 'medium' ? '← YOU ARE HERE' : ''}):
          * Ask practical, application-based questions
          * Focus on "how" and "when"
          * Test problem-solving and implementation
          * Use real-world scenarios
          * Include some trade-off considerations
          * Difficulty should be: "medium"
        
        - Senior Level (${baseDifficulty === 'hard' ? '← YOU ARE HERE' : ''}):
          * Ask architectural and design questions
          * Focus on "why" and trade-offs
          * Test decision-making and optimization
          * Use complex, multi-faceted scenarios
          * Include edge cases and scalability
          * Difficulty should be: "hard"
        
        - Staff+ Level (${baseDifficulty === 'staff' ? '← YOU ARE HERE' : ''}):
          * Ask system-level and strategic questions
          * Focus on "what if" and long-term impact
          * Test leadership and vision
          * Use abstract, high-level scenarios
          * Include cross-system implications
          * Difficulty should be: "staff"

        IMPORTANT: The question difficulty MUST match the experience level:
        - If level is Junior → difficulty MUST be "easy"
        - If level is Mid-Level → difficulty MUST be "medium"
        - If level is Senior → difficulty MUST be "hard"
        - If level is Staff+ → difficulty should be "staff"

        Interview Context:
        Role: ${role || 'Software Engineer'}
        Primary Skill: ${skill || 'General'}
        ${allSkills && allSkills.length > 1 ? `All Skills to Cover: ${allSkills.join(', ')}` : ''}
        Experience Level: ${level || 'Mid-Level'}
        Base Difficulty Required: ${baseDifficulty}
        Current Turn: ${turnNumber || 'N/A'}
        Question Style for Variety: ${questionStyle}
        
        ========================================
        PREVIOUS QUESTIONS - DO NOT REPEAT
        ========================================
        ${previousQuestionsText}
        ${usedQuestionStyles}
        
        Concepts Already Tested: ${testedConceptsList}
        Previous Weak Areas: ${JSON.stringify(weakAreas || [])}
        Previous Strong Areas: ${JSON.stringify(strongAreas || [])}
        ${adaptationContext}
        ${cognitiveContext}
        
        ========================================
        VARIETY ENFORCEMENT - CRITICAL
        ========================================
        QUESTION STYLE ROTATION:
        - This is turn ${turnNumber || 'N/A'}, so you MUST use question style: "${questionStyle}"
        - The last ${Math.min(previousQuestions?.length || 0, 3)} questions used different styles
        - Rotate through these styles: conceptual explanation → practical scenario → trade-off analysis → problem-solving → architecture design → debugging scenario → optimization challenge → system design → code review → best practices
        
        UNIQUENESS REQUIREMENTS:
        - This question MUST be COMPLETELY DIFFERENT from all ${previousQuestions?.length || 0} previous questions
        - Use a DIFFERENT question format/structure than recent questions
        - Use DIFFERENT entry phrases: rotate between "Explain", "How would you", "What would happen if", "Design", "Debug", "Optimize", "Compare", "Evaluate"
        - Test DIFFERENT aspects or subtopics within ${skill}
        - If multiple skills available (${allSkills?.join(', ') || skill}), consider testing a different skill
        - Avoid similar phrasing, sentence structure, or approach to previous questions
        
        EXAMPLE OF GOOD VARIETY:
        - If Q1 was: "Explain how X works" (conceptual)
        - Then Q2 should be: "How would you implement X in scenario Y?" (practical)
        - Then Q3 should be: "What are the trade-offs between X and Y?" (analysis)
        - Then Q4 should be: "Design a system that uses X to solve Z" (design)
        
        BAD (REPETITIVE):
        - Q1: "Explain how React works"
        - Q2: "Explain how React hooks work" ❌ (too similar)
        
        GOOD (VARIED):
        - Q1: "Explain how React works"
        - Q2: "How would you optimize a React app that's rendering slowly?" ✓ (different style, different focus)

        CRITICAL INSTRUCTIONS:
        ${adaptationDecision ? `
        FOLLOW THE ADAPTATION STRATEGY:
        - Decision: ${adaptationDecision.decision}
        - Question Type: ${adaptationDecision.question_type}
        - Probe Direction: ${adaptationDecision.probe_direction}
        - If should_go_deeper=true, ask "why", "how", or "what if" questions
        - If should_switch_topic=true, move to a different concept but stay in skill area
        - If difficulty is "easier", ask foundational questions (but still respect base difficulty ${baseDifficulty})
        - If difficulty is "harder", ask abstract, trade-off, or edge case questions (but still respect base difficulty ${baseDifficulty})
        ` : `
        Generate the next best interview question that:
        1. Is relevant to the role and skill.
        2. Matches the base difficulty ${baseDifficulty} for experience level ${level}.
        3. Uses question style: ${questionStyle} for variety.
        4. Adapts based on previous answers.
        5. Increases depth if candidate is strong.
        6. Narrows focus if candidate is weak.
        7. Is realistic and used in real interviews.
        8. Cannot be answered with a one-liner.
        9. Is COMPLETELY UNIQUE from all previous questions.
        `}

        FINAL VERIFICATION CHECKLIST:
        1. ✓ This question is NOT similar to any previous question (check word-by-word)
        2. ✓ This question tests NEW concepts or NEW aspects of existing concepts
        3. ✓ This question uses a DIFFERENT style/format than recent questions
        4. ✓ This question matches the base difficulty ${baseDifficulty} for ${level}
        5. ✓ This question is appropriate for the current adaptation strategy
        6. ✓ This question brings NEW value and hasn't been asked before

        Return JSON only in this format:
        {
          "question_id": "auto-generated-uuid-${Date.now()}",
          "question_text": "A completely unique question that has NOT been asked before",
          "skill_focus": "${skill}",
          "difficulty": "${baseDifficulty}",
          "intent": "What this question is testing (be specific and different from previous questions)",
          "expected_concepts": [
            "Key concept 1 (preferably new or different angle)",
            "Key concept 2",
            "Key concept 3"
          ],
          "reasoning": "Why this question was chosen at this moment (explain the cognitive probing strategy and why it's unique)",
          "evaluation_rubric": {
            "excellent": "What a top answer should include",
            "average": "What a mid answer looks like",
            "poor": "What a weak answer looks like"
          },
          "probe_type": "${adaptationDecision?.question_type || 'deep'}",
          "expected_depth": "How deep the answer should go (surface | moderate | deep | expert)",
          "uniqueness": "How this question differs from previous questions"
        }
        `;

        try {
            const result = await generateContentWithFallback(prompt, { 
                response_format: { type: 'json_object' },
                temperature: 0.9,  // Higher temperature for more variety and creativity
                max_tokens: 1000  // Reduced to work within credit limits
            });
            
            // GitHub Models API returns response in Azure AI Inference format
            let text = result.responseText || (result.response ? 
                (typeof result.response.text === 'function' 
                    ? result.response.text() 
                    : result.response.text) 
                : null);
            
            if (!text) {
                throw new Error("No response text found in API response");
            }
            
            // Sanitize and parse
            let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Try to find JSON object in the text
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
            const questionData = JSON.parse(jsonStr);

            // Ensure unique ID if not provided or valid
            if (!questionData.question_id || questionData.question_id.includes('auto-generated-uuid')) {
                questionData.question_id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Verify question is not a duplicate (enhanced check)
            const questionText = questionData.question_text || questionData.text || '';
            if (previousQuestions && previousQuestions.length > 0) {
                const currLower = questionText.toLowerCase();
                const similarityCheck = previousQuestions.some(prevQ => {
                    const prevLower = (prevQ.text || prevQ || '').toLowerCase();
                    // Check for high similarity using multiple heuristics
                    const words1 = prevLower.split(/\s+/).filter(w => w.length > 3);
                    const words2 = currLower.split(/\s+/).filter(w => w.length > 3);
                    const commonWords = words1.filter(w => words2.includes(w));
                    const similarity = commonWords.length / Math.max(words1.length, words2.length);
                    
                    // Also check for substring matches
                    const substringMatch = prevLower.includes(currLower.substring(0, 30)) || 
                                         currLower.includes(prevLower.substring(0, 30));
                    
                    return similarity > 0.5 || substringMatch;
                });
                
                if (similarityCheck) {
                    console.warn('⚠ Generated question may be similar to previous question');
                    console.warn('⚠ This should be rare - the AI should avoid repetition');
                    // Don't modify the question, but log it for monitoring
                }
            }
            
            // Ensure difficulty matches the experience level
            const generatedDifficulty = questionData.difficulty?.toLowerCase();
            if (generatedDifficulty !== baseDifficulty && 
                !['easier', 'harder', 'same'].includes(generatedDifficulty)) {
                console.warn(`⚠ Generated difficulty "${generatedDifficulty}" doesn't match base difficulty "${baseDifficulty}" for level ${level}`);
                // Override to ensure it matches
                questionData.difficulty = baseDifficulty;
            }

            // Normalize for frontend compatibility (QuestionBlock expects .text and .id)
            return {
                ...questionData,
                id: questionData.question_id,
                text: questionData.question_text,
                // Ensure reasoning is included
                reasoning: questionData.reasoning || 'Question generated based on interview context'
            };
        } catch (error) {
            console.error("Question Generation Error:", error);
            // Fallback question
            return {
                question_id: `fallback-${Date.now()}`,
                id: `fallback-${Date.now()}`,
                question_text: `Could you explain the core concepts of ${skill}?`,
                text: `Could you explain the core concepts of ${skill}?`,
                skill_focus: skill,
                difficulty: level,
                intent: 'Fallback check of basics',
            };
        }
    }
}

module.exports = new QuestionBlock();
