const pdfParse = require('pdf-parse');
const multer = require('multer');
const { generateContentWithFallback } = require('../config/github-models-helper');

// Use memory storage because we only need the file briefly for analysis
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF and TXT files are supported'), false);
    }
    cb(null, true);
  },
});

// Basic keyword-based fallback if AI parsing fails
function extractTopicsFallback(text) {
  const lower = text.toLowerCase();
  const keywords = [
    'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'sql', 'postgres', 'mysql',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'git', 'rest', 'graphql', 'microservices',
    'frontend', 'backend', 'full stack', 'system design', 'devops', 'testing', 'unit testing',
    'integration testing', 'leadership', 'ownership', 'communication', 'teamwork',
  ];

  const topics = new Set();
  keywords.forEach((k) => {
    if (lower.includes(k)) topics.add(k);
  });

  return {
    topics: Array.from(topics),
    rawSkills: Array.from(topics),
  };
}

exports.analyzeResume = [
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No resume file uploaded' });
      }

      let text;
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        text = data.text || '';
      } else if (req.file.mimetype === 'text/plain') {
        text = req.file.buffer.toString('utf-8');
      } else {
        return res
          .status(400)
          .json({ message: 'Unsupported file type. Please upload a PDF or TXT file.' });
      }

      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          message: 'Could not read enough text from the resume. Please upload a clearer file.',
        });
      }

      // Truncate very long resumes to keep prompt size reasonable
      const truncated = text.length > 8000 ? text.slice(0, 8000) : text;

      let topics = [];
      let rawSkills = [];

      try {
        const prompt = `You are a resume analyzer for a technical interview platform.

From the following resume text, extract two arrays:
1) topics: high-level interview topics (e.g. "React", "Node.js", "System Design", "Leadership")
2) rawSkills: more granular skills/keywords (e.g. "React", "TypeScript", "MongoDB", "AWS", "Docker").

Return ONLY valid JSON in this exact shape, no prose:
{
  "topics": ["topic1", "topic2", ...],
  "rawSkills": ["skill1", "skill2", ...]
}

Resume text:
\"\"\"
${truncated}
\"\"\"`;

        const resp = await generateContentWithFallback(prompt);
        const content = resp.text || resp;

        // Try to parse JSON, stripping ``` if present
        let jsonString = content;
        const match =
          content.match(/```json[\\s\\S]*?```/) || content.match(/```[\\s\\S]*?```/);
        if (match) {
          jsonString = match[0].replace(/```json|```/g, '');
        }

        const parsed = JSON.parse(jsonString.trim());
        topics = Array.isArray(parsed.topics) ? parsed.topics : [];
        rawSkills = Array.isArray(parsed.rawSkills) ? parsed.rawSkills : [];
      } catch (err) {
        console.warn(
          'AI resume analysis failed, falling back to keyword extraction:',
          err.message
        );
        const fallback = extractTopicsFallback(text);
        topics = fallback.topics;
        rawSkills = fallback.rawSkills;
      }

      // De-duplicate and normalize
      const norm = (arr) =>
        Array.from(new Set((arr || []).map((s) => String(s).trim()))).filter(Boolean);

      return res.status(200).json({
        message: 'Resume analyzed successfully',
        topics: norm(topics),
        rawSkills: norm(rawSkills),
      });
    } catch (error) {
      console.error('Resume analysis error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to analyze resume',
      });
    }
  },
];

// Simple heuristic-based ATS-style analysis used as fallback when AI response is unusable
function computeHeuristicATS(text, targetRole) {
  const raw = text || '';
  const lower = raw.toLowerCase();
  const words = raw.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Length / density
  let lengthScore = 0;
  if (wordCount < 150) lengthScore = 40;
  else if (wordCount < 300) lengthScore = 70;
  else if (wordCount <= 900) lengthScore = 90;
  else lengthScore = 60;

  // Section structure
  const sectionKeywords = [
    'experience',
    'work experience',
    'professional experience',
    'projects',
    'education',
    'skills',
    'summary',
    'objective',
  ];
  let sectionHits = 0;
  sectionKeywords.forEach((s) => {
    if (lower.includes(s)) sectionHits += 1;
  });
  const structure = Math.min(100, sectionHits * 20);

  // Readability via avg sentence length
  const sentences = raw.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : 0;
  let readability = 70;
  if (avgSentenceLength > 0) {
    if (avgSentenceLength < 8) readability = 60;
    else if (avgSentenceLength <= 25) readability = 85;
    else if (avgSentenceLength <= 35) readability = 70;
    else readability = 55;
  }

  // Impact: presence of bullets / numbers / % signs
  const lines = raw.split(/\n+/);
  const impactSignals = lines.filter((l) =>
    /^[-*•]/.test(l.trim()) || /\d{4}/.test(l) || /%/.test(l)
  ).length;
  const impact = Math.min(100, impactSignals * 10);

  // Keyword alignment
  const techKeywords = [
    'javascript','typescript','react','node','express','mongodb','sql','postgres','mysql',
    'aws','gcp','azure','docker','kubernetes','git','rest','graphql','microservices',
    'frontend','backend','full stack','system design','devops','testing','unit testing',
    'integration testing'
  ];
  let hits = 0;
  techKeywords.forEach((k) => {
    if (lower.includes(k)) hits += 1;
  });
  const keywords = Math.min(100, Math.round((hits / techKeywords.length) * 100));

  const clarity = Math.round((readability + lengthScore) / 2);

  const overallScore = Math.round(
    (structure + clarity + impact + keywords + readability) / 5
  );

  const strengths = [];
  const issues = [];
  const recommendations = [];
  const missingKeywords = [];

  if (structure >= 70) {
    strengths.push('Resume has a recognizable section structure (e.g., Experience, Education, Skills).');
  } else {
    issues.push('Section structure is weak or missing key sections like Experience, Education, or Skills.');
    recommendations.push('Add clear sections with headings such as: Summary, Experience, Projects, Education, and Skills.');
  }

  if (keywords >= 60) {
    strengths.push('Resume includes a reasonable number of relevant technical keywords.');
  } else {
    issues.push('Resume appears to be light on role-specific technical keywords.');
    recommendations.push('Add more concrete technologies, tools, and frameworks that you have actually used (e.g., React, Node.js, AWS).');
  }

  if (impact >= 60) {
    strengths.push('Experience is described with bullet points and some measurable impact.');
  } else {
    issues.push('Bullet points or measurable outcomes (numbers, percentages) are limited.');
    recommendations.push('Rewrite experience bullets to highlight outcomes (e.g., “Improved load time by 30% by optimizing API queries”).');
  }

  if (readability < 60) {
    issues.push('Average sentence length suggests the resume may be hard to scan quickly.');
    recommendations.push('Break up long paragraphs into shorter bullets and keep sentences concise (10–20 words).');
  }

  // Simple missing keywords suggestion from techKeywords
  if (keywords < 70) {
    techKeywords.slice(0, 8).forEach((kw) => {
      if (!lower.includes(kw)) missingKeywords.push(kw);
    });
  }

  const roleText = targetRole ? ` for ${targetRole}` : '';
  const summary = `This is an approximate ATS-style estimate based on resume structure, content density, and keyword usage${roleText}. It is heuristic, not a definitive hiring verdict.`;

  return {
    overallScore,
    sectionScores: {
      structure,
      clarity,
      impact,
      keywords,
      readability,
    },
    summary,
    strengths,
    issues,
    missingKeywords,
    recommendations,
  };
}

// ATS-style resume analysis: scoring + concrete recommendations
exports.analyzeResumeATS = [
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No resume file uploaded' });
      }

      let text;
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdfParse(req.file.buffer);
        text = data.text || '';
      } else if (req.file.mimetype === 'text/plain') {
        text = req.file.buffer.toString('utf-8');
      } else {
        return res
          .status(400)
          .json({ message: 'Unsupported file type. Please upload a PDF or TXT file.' });
      }

      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          message:
            'Could not read enough text from the resume. Please upload a clearer file (PDF or TXT).',
        });
      }

      const truncated = text.length > 8000 ? text.slice(0, 8000) : text;
      const targetRole = (req.body?.targetRole || '').toString().trim();

      const prompt = `You are an experienced technical recruiter and ATS specialist.
You evaluate resumes for startups and top tech companies.

TASK:
- Act strictly as an ATS-style evaluator.
- Be factual and precise. Do NOT be overly positive.
- Focus on structure, clarity, impact, and keyword alignment for the specified role.

INPUT:
- Target role (may be empty): "${targetRole || 'Not specified'}"
- Resume text:
\"\"\" 
${truncated}
\"\"\"

OUTPUT:
Return ONLY valid JSON in this exact shape, no extra prose:
{
  "overallScore": 0-100 integer,
  "sectionScores": {
    "structure": 0-100,
    "clarity": 0-100,
    "impact": 0-100,
    "keywords": 0-100,
    "readability": 0-100
  },
  "summary": "2-3 genuine sentences summarizing how strong this resume is for the target role.",
  "strengths": [
    "short, concrete bullet summarizing a real strength",
    "..."
  ],
  "issues": [
    "short, concrete bullet describing a real problem or weakness",
    "..."
  ],
  "missingKeywords": [
    "important keyword or concept that is missing but expected for this role",
    "..."
  ],
  "recommendations": [
    "specific, actionable change to improve the resume",
    "..."
  ]
}

Rules:
- Be honest and realistic. If the resume is weak, say so.
- Only include recommendations that directly follow from the text you see.
- If targetRole is empty, evaluate it as a generic software/tech resume.`;

      const resp = await generateContentWithFallback(prompt);
      // Coerce to a string safely (GitHub Models helper may return objects)
      const rawContent =
        typeof resp === 'string'
          ? resp
          : typeof resp?.text === 'string'
            ? resp.text
            : JSON.stringify(resp || {});

      // Extract JSON (support ```json``` wrappers)
      let jsonString = rawContent;
      const match =
        rawContent.match(/```json[\\s\\S]*?```/) || rawContent.match(/```[\\s\\S]*?```/);
      if (match) {
        jsonString = match[0].replace(/```json|```/g, '');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonString.trim());
      } catch (parseErr) {
        console.error('Failed to parse ATS JSON:', parseErr.message);
        return res.status(500).json({
          message:
            'AI analysis failed to produce a valid result. Please try again with a simpler resume.',
        });
      }

      // Basic normalization to avoid undefined values on frontend
      const safeNumber = (n, def = 0) =>
        Number.isFinite(Number(n)) ? Math.max(0, Math.min(100, Number(n))) : def;

      let result = {
        overallScore: safeNumber(parsed.overallScore, 0),
        sectionScores: {
          structure: safeNumber(parsed.sectionScores?.structure, 0),
          clarity: safeNumber(parsed.sectionScores?.clarity, 0),
          impact: safeNumber(parsed.sectionScores?.impact, 0),
          keywords: safeNumber(parsed.sectionScores?.keywords, 0),
          readability: safeNumber(parsed.sectionScores?.readability, 0),
        },
        summary: parsed.summary || '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        missingKeywords: Array.isArray(parsed.missingKeywords)
          ? parsed.missingKeywords
          : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
      };

      // If AI returned essentially no signal (all zeros and empty lists), fall back to heuristic
      const allZeros =
        result.overallScore === 0 &&
        Object.values(result.sectionScores).every((v) => v === 0) &&
        result.strengths.length === 0 &&
        result.issues.length === 0 &&
        result.recommendations.length === 0;

      if (allZeros) {
        console.warn('AI ATS response empty or non-informative, using heuristic fallback.');
        result = computeHeuristicATS(text, targetRole);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Resume ATS analysis error:', error);
      return res.status(500).json({
        message: error.message || 'Failed to analyze resume for ATS scoring',
      });
    }
  },
];


